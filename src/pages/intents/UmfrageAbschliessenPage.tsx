/**
 * Umfrage abschließen — 4-Schritt-Wizard.
 * Steps: 1) Offene Umfrage wählen → 2) Antworten je Terminvorschlag ansehen → 3) Gewählten Termin auswählen → 4) Prüfen & abschließen (Status wird auf „abgeschlossen“ gesetzt).
 * Reads: umfragen, terminvorschlaege, antworten. Writes: umfragen (update: gewaehlter_termin, status).
 * Composes: IntentWizardShell, EntitySelectStep, StepNav, SummaryStep, SuccessStep.
 */
import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldDate, fieldLookup, fieldRef } from '@/lib/journey';
import type { JourneyRecord } from '@/lib/journey';
import { useUmfrageAbschliessenFlow } from '@/lib/journey/flows/UmfrageAbschliessen';
import { tx } from '@/i18n';

interface Tally {
  ja: number;
  vielleicht: number;
  nein: number;
}

function terminLabel(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd.MM.yyyy HH:mm');
  } catch {
    return iso;
  }
}

export default function UmfrageAbschliessenPage() {
  const [step, setStep] = useState(1);
  const [antworten, setAntworten] = useState<JourneyRecord[]>([]);
  const [antwortenLoading, setAntwortenLoading] = useState(false);

  const flow = useUmfrageAbschliessenFlow({
    steps: { umfragen: 1, gewaehlter_termin: 3 },
    items: {
      umfragen: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: fieldLookup(r, 'status')?.label ?? '',
      }),
      gewaehlter_termin: r => ({
        id: r.id,
        title: terminLabel(fieldDate(r, 'start')),
      }),
    },
  });

  const umfragePick = flow.pick('umfragen');
  const umfrageId = (umfragePick.selectedId as string | null | undefined) ?? null;
  const umfrageName = umfrageId ? flow.picks.umfragen.labelOf(umfrageId) ?? '' : '';

  const termine = useMemo(
    () =>
      flow.picks.gewaehlter_termin.records
        .filter(r => !umfrageId || fieldRef(r, 'umfrage') === umfrageId)
        .sort((a, b) => (fieldDate(a, 'start') ?? '').localeCompare(fieldDate(b, 'start') ?? '')),
    [flow.picks.gewaehlter_termin.records, umfrageId],
  );

  useEffect(() => {
    if (!umfrageId) {
      setAntworten([]);
      return;
    }
    let cancelled = false;
    setAntwortenLoading(true);
    flow.port
      .list('antworten', { limit: 1000 })
      .then(list => {
        if (!cancelled) setAntworten(list);
      })
      .catch(() => {
        if (!cancelled) setAntworten([]);
      })
      .finally(() => {
        if (!cancelled) setAntwortenLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [umfrageId]);

  const rows = useMemo(() => {
    const byTermin = new Map<string, Tally>();
    for (const t of termine) byTermin.set(t.id, { ja: 0, vielleicht: 0, nein: 0 });
    for (const a of antworten) {
      const tid = fieldRef(a, 'terminvorschlag');
      const tally = tid ? byTermin.get(tid) : undefined;
      const key = fieldLookup(a, 'wert')?.key;
      if (tally && (key === 'ja' || key === 'vielleicht' || key === 'nein')) tally[key] += 1;
    }
    const list = termine.map(t => ({ id: t.id, start: fieldDate(t, 'start'), tally: byTermin.get(t.id)! }));
    let bestId: string | null = null;
    let best = -1;
    for (const r of list) {
      const score = r.tally.ja * 1000 + r.tally.vielleicht;
      if (score > best && r.tally.ja + r.tally.vielleicht > 0) {
        best = score;
        bestId = r.id;
      }
    }
    return { list, bestId };
  }, [termine, antworten]);

  const maxTotal = Math.max(1, ...rows.list.map(r => r.tally.ja + r.tally.vielleicht + r.tally.nein));

  return (
    <IntentWizardShell
      title={tx('Umfrage abschließen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Such dir den besten Termin aus den Antworten aus und schließe die Umfrage ab.'),
        needs: [tx('Eine offene Umfrage mit Antworten')],
      }}
    >
      <WizardStep label={tx('Umfrage')} description={tx('Welche Umfrage möchtest du abschließen?')}>
        <EntitySelectStep
          {...flow.picks.umfragen.select}
          {...umfragePick}
          searchPlaceholder={tx('Titel suchen …')}
          emptyText={tx('Es gibt keine Umfrage zum Abschließen.')}
          onSelect={id => {
            umfragePick.onSelect(id);
            setStep(2);
          }}
        />
      </WizardStep>

      <WizardStep label={tx('Antworten')} description={tx('So haben die Teilnehmer auf die Terminvorschläge geantwortet.')}>
        {!umfrageId ? (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{umfrageName}</p>
            {antwortenLoading ? (
              <p className="text-sm text-muted-foreground">{tx('Antworten werden geladen …')}</p>
            ) : rows.list.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tx('Diese Umfrage hat keine Terminvorschläge.')}</p>
            ) : (
              <ul className="space-y-3">
                {rows.list.map(r => {
                  const total = r.tally.ja + r.tally.vielleicht + r.tally.nein;
                  return (
                    <li key={r.id} className="overflow-hidden rounded-2xl border bg-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-medium">{terminLabel(r.start)}</span>
                        {r.id === rows.bestId && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            {tx('Meiste Zusagen')}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="bg-emerald-500" style={{ width: `${(r.tally.ja / maxTotal) * 100}%` }} />
                        <div className="bg-amber-400" style={{ width: `${(r.tally.vielleicht / maxTotal) * 100}%` }} />
                        <div className="bg-red-400" style={{ width: `${(r.tally.nein / maxTotal) * 100}%` }} />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {tx`${r.tally.ja} Ja · ${r.tally.vielleicht} Vielleicht · ${r.tally.nein} Nein (${total} Antworten)`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
            <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} nextStepLabel={tx('Termin wählen')} />
          </div>
        )}
      </WizardStep>

      <WizardStep label={tx('Termin')} description={tx('Welcher Termin soll es werden?')}>
        {!umfrageId ? (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        ) : (
          <div className="space-y-4">
            <EntitySelectStep
              {...flow.picks.gewaehlter_termin.select}
              {...flow.pick('gewaehlter_termin')}
              avatar="none"
              create={false}
              emptyText={tx('Diese Umfrage hat keine Terminvorschläge.')}
            />
            <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Prüfen')} />
          </div>
        )}
      </WizardStep>

      <WizardStep label={tx('Prüfen')} description={tx('Mit dem Abschluss wird der Status auf „abgeschlossen“ gesetzt.')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'status', label: tx('Status'), value: tx('Abgeschlossen') }]}
            whatHappensNext={tx('Die Umfrage ist danach geschlossen. Als Nächstes kannst du die Teilnehmer informieren.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          actions={{ copy: false, print: false }}
          next={[
            { label: tx('Weitere Umfrage abschließen') },
            { label: tx('Umfrage mit Terminen anlegen'), href: '#/intents/umfrage-anlegen' },
            { label: tx('Teilnehmer einladen'), href: '#/intents/teilnehmer-einladen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
