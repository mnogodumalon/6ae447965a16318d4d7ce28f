import { useMemo, useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { IconAlertTriangle, IconPlus, IconUserQuestion, IconClockHour4 } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { flowActionFor } from '@/config/plan';
import { extractRecordId } from '@/services/livingAppsService';
import { lookupKey, formatDate } from '@/lib/formatters';
import { LOOKUP_OPTIONS } from '@/types/app';
import type { EnrichedAntworten } from '@/types/enriched';
import { tx, dateFnsLocale } from '@/i18n';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { KanbanWidget, type KanbanCard, type KanbanColumn } from '@/components/widgets/KanbanWidget';
import { ChartWidget, type ChartRow } from '@/components/widgets/ChartWidget';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { umfragen, teilnehmer, antworten } = data;
  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type !== 'umfragen') return undefined;
      if (lookupKey(top.record.fields.status) !== 'offen') return undefined;
      const go = flowActionFor('umfragen', 'status', top.record.record_id, 'abgeschlossen');
      return go ? { label: tx('Umfrage abschließen'), onClick: go } : undefined;
    },
  });
  const enrichedAntworten = crud.enriched.antworten;
  const clock = useClock();
  const [onlyPending, setOnlyPending] = useState(false);

  const columns = useMemo<KanbanColumn[]>(
    () => (LOOKUP_OPTIONS['umfragen']?.['status'] ?? []).map(o => ({ key: o.key, label: o.label })),
    [],
  );

  const isOpen = (u: (typeof umfragen)[number]) => lookupKey(u.fields.status) === 'offen';
  const fristOf = (u: (typeof umfragen)[number]) => {
    const f = u.fields.frist ? parseISO(u.fields.frist) : null;
    return f && isValid(f) ? f : null;
  };

  const overdue = umfragen.filter(u => isOpen(u) && (fristOf(u)?.getTime() ?? Infinity) < clock.getTime());
  const openPolls = umfragen.filter(isOpen);
  const openIds = new Set(openPolls.map(u => u.record_id));

  const pendingPeople = teilnehmer.filter(t => !t.fields.geantwortet_am && openIds.has(extractRecordId(t.fields.umfrage) ?? ''));
  const pendingByPoll = new Map<string, number>();
  const totalByPoll = new Map<string, number>();
  teilnehmer.forEach(t => {
    const id = extractRecordId(t.fields.umfrage);
    if (!id) return;
    totalByPoll.set(id, (totalByPoll.get(id) ?? 0) + 1);
    if (!t.fields.geantwortet_am) pendingByPoll.set(id, (pendingByPoll.get(id) ?? 0) + 1);
  });

  const pollTitle = (id: string | null) => umfragen.find(u => u.record_id === id)?.fields.titel ?? '';
  const personName = (t: (typeof teilnehmer)[number]) =>
    [t.fields.vorname, t.fields.nachname].filter(Boolean).join(' ') || t.fields.mail || '—';

  const answered = openPolls.length > 0
    ? teilnehmer.filter(t => t.fields.geantwortet_am && openIds.has(extractRecordId(t.fields.umfrage) ?? '')).length
    : 0;
  const invitedOpen = answered + pendingPeople.length;
  const quote = invitedOpen > 0 ? Math.round((answered / invitedOpen) * 100) : 0;

  const cards = useMemo<KanbanCard[]>(
    () => umfragen
      .filter(u => !onlyPending || (pendingByPoll.get(u.record_id) ?? 0) > 0)
      .map(u => {
        const status = lookupKey(u.fields.status) ?? columns[0]?.key ?? '';
        const f = u.fields.frist ? parseISO(u.fields.frist) : null;
        const late = status === 'offen' && f && isValid(f) && f.getTime() < clock.getTime();
        const total = totalByPoll.get(u.record_id) ?? 0;
        const pend = pendingByPoll.get(u.record_id) ?? 0;
        const parts = [
          f && isValid(f) ? tx`Frist ${format(f, 'dd.MM.yyyy HH:mm', { locale: dateFnsLocale() })}` : '',
          total > 0 ? tx`${total - pend}/${total} geantwortet` : tx`Noch keine Teilnehmer`,
        ].filter(Boolean);
        return {
          id: `umfrage:${u.record_id}`,
          column: status,
          title: u.fields.titel ?? '—',
          subtitle: parts.join(' · '),
          tone: late ? 'warning' : status === 'offen' ? 'primary' : 'default',
        } as KanbanCard;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [umfragen, teilnehmer, columns, clock, onlyPending],
  );

  const rows = useMemo<ChartRow<EnrichedAntworten>[]>(
    () => enrichedAntworten.map(a => ({ id: `antwort:${a.record_id}`, data: a })),
    [enrichedAntworten],
  );
  const ja = antworten.filter(a => lookupKey(a.fields.wert) === 'ja').length;
  const vl = antworten.filter(a => lookupKey(a.fields.wert) === 'vielleicht').length;
  const nein = antworten.filter(a => lookupKey(a.fields.wert) === 'nein').length;

  const closeFlow = (id: string) => flowActionFor('umfragen', 'status', id, 'abgeschlossen');

  const done = umfragen.filter(u => lookupKey(u.fields.status) === 'abgeschlossen' && u.fields.gewaehlter_termin);
  const doneRecords = crud.enriched.umfragen.filter(u => done.some(d => d.record_id === u.record_id));

  let context: string;
  if (umfragen.length === 0) {
    context = tx`Lege deine erste Terminumfrage an.`;
  } else if (overdue.length > 0) {
    context = tx`${namen(overdue.map(u => u.fields.titel ?? ''))}: Frist abgelaufen, wartet auf deine Terminwahl.`;
  } else if (pendingPeople.length > 0) {
    context = tx`Noch keine Antwort von ${namen(pendingPeople.map(personName))}.`;
  } else if (openPolls.length > 0) {
    context = tx`Alle Teilnehmer haben bei ${namen(openPolls.map(u => u.fields.titel ?? ''))} geantwortet.`;
  } else {
    context = tx`Keine offene Umfrage — zuletzt abgeschlossen: ${namen(done.map(u => u.fields.titel ?? ''))}.`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{context}</p>
        </div>
        {crud.umfragen.canWrite && (
          <Button onClick={() => crud.umfragen.openCreate({ status: 'offen' })}>
            <IconPlus size={16} className="shrink-0" />
            {tx('Neue Umfrage')}
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        hero={overdue.length > 0 ? (
          <HeroBanner
            icon={<IconAlertTriangle size={18} />}
            action={{
              label: tx('Umfrage abschließen'),
              onClick: () => (closeFlow(overdue[0].record_id) ?? (() => crud.umfragen.openDetail(overdue[0])))(),
            }}
          >
            <b>{namen(overdue.map(u => u.fields.titel ?? ''))}</b>{' '}
            {tx`— Antwortfrist abgelaufen, der Termin ist noch nicht gewählt.`}
          </HeroBanner>
        ) : undefined}
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Antwort ausstehend')}
              value={pendingPeople.length}
              icon={<IconUserQuestion size={18} className="text-muted-foreground" />}
              tone={pendingPeople.length > 0 ? 'warning' : 'default'}
              onClick={() => setOnlyPending(v => !v)}
              active={onlyPending}
            />
            <StatStripItem
              title={tx('Antwortquote offener Umfragen')}
              value={invitedOpen > 0 ? `${quote} %` : '—'}
              icon={<IconClockHour4 size={18} className="text-muted-foreground" />}
            />
          </StatStrip>
        }
        primary={
          <KanbanWidget
            cards={cards}
            columns={columns}
            defaultCollapsed={['abgesagt']}
            onCardClick={card => {
              const rec = umfragen.find(u => u.record_id === card.id.split(':')[1]);
              if (rec) crud.umfragen.openDetail(rec);
            }}
            onCardMove={(cardId, col) => {
              const id = cardId.split(':')[1];
              if (!id) return;
              if (col === 'abgeschlossen') {
                const go = closeFlow(id);
                go?.();
                if (go) undoToast(tx('Ablauf „Umfrage abschließen“ geöffnet'));
                return tx('Im Ablauf „Umfrage abschließen“ bestätigen');
              }
              return tx('Status ändern: Umfrage öffnen und bearbeiten');
            }}
            onAddCard={col => crud.umfragen.openCreate({ status: col })}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Antwort ausstehend')}
              icon={<IconUserQuestion size={16} />}
              items={pendingPeople.map(t => ({
                id: t.record_id,
                title: personName(t),
                secondLine: (
                  <>
                    <span className="font-medium text-amber-600">{tx('Noch keine Antwort')}</span>
                    <span className="text-muted-foreground"> · {pollTitle(extractRecordId(t.fields.umfrage))}</span>
                  </>
                ),
              }))}
              onItemClick={id => {
                const rec = teilnehmer.find(t => t.record_id === id);
                if (rec) crud.teilnehmer.openDetail(rec);
              }}
              empty={{
                text: tx('Alle Eingeladenen haben geantwortet.'),
                action: crud.teilnehmer.canWrite ? { label: tx('Teilnehmer hinzufügen'), onClick: () => crud.teilnehmer.openCreate({}) } : undefined,
              }}
            />
            <WorkList
              title={tx('Abgeschlossen mit gewähltem Termin')}
              items={doneRecords.map(u => ({
                id: u.record_id,
                title: u.fields.titel ?? '—',
                secondLine: (
                  <span className="text-muted-foreground">
                    {u.gewaehlter_terminName ? u.gewaehlter_terminName : formatDate(u.fields.frist)}
                  </span>
                ),
              }))}
              onItemClick={id => {
                const rec = umfragen.find(u => u.record_id === id);
                if (rec) crud.umfragen.openDetail(rec);
              }}
              empty={{ text: tx('Noch keine Umfrage mit gewähltem Termin abgeschlossen.') }}
            />
            <ChartWidget<EnrichedAntworten>
              title={tx('Antworten je Terminvorschlag')}
              rows={rows}
              dimension={{ kind: 'category', accessor: r => r.data.terminvorschlagName, label: tx('Terminvorschlag') }}
              footer={<>{tx`Ja ${ja} · Vielleicht ${vl} · Nein ${nein}`}</>}
            />
          </>
        }
      />
      {crud.surfaces}
    </div>
  );
}
