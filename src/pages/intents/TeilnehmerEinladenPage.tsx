/**
 * Teilnehmer einladen — 3-Schritt-Wizard.
 * Steps: 1) Offene Umfrage wählen → 2) Vorname, Nachname und E-Mail erfassen → 3) Prüfen & einladen (Token wird vergeben).
 * Reads: umfragen. Writes: teilnehmer (über useTeilnehmerEinladenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldDate, fieldLookup } from '@/lib/journey';
import { useTeilnehmerEinladenFlow } from '@/lib/journey/flows/TeilnehmerEinladen';
import { tx } from '@/i18n';

function newToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}

export default function TeilnehmerEinladenPage() {
  const [step, setStep] = useState(1);
  const flow = useTeilnehmerEinladenFlow({
    steps: { umfrage: 1, vorname: 2, nachname: 2, mail: 2 },
    items: {
      umfrage: r => {
        const frist = fieldDate(r, 'frist');
        let fristText = '';
        if (frist) {
          try { fristText = format(parseISO(frist), 'dd.MM.yyyy HH:mm'); } catch { fristText = frist; }
        }
        const status = fieldLookup(r, 'status');
        return {
          id: r.id,
          title: fieldText(r, 'titel'),
          subtitle: fristText ? tx`Antwortfrist: ${fristText}` : undefined,
          status: status ?? undefined,
        };
      },
    },
    compute: { token: () => newToken() },
  });

  const result = flow.submit.result;
  const facts = result
    ? [
        { label: tx('Nachname'), value: String(result.primary.fields.nachname ?? '') },
        { label: tx('Persönliches Token'), value: String(result.primary.fields.token ?? '') },
      ]
    : undefined;

  return (
    <IntentWizardShell
      title={tx('Teilnehmer einladen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine Umfrage wählen und Teilnehmer mit persönlichem Token einladen.'),
        needs: [tx('Vorname und Nachname'), tx('E-Mail-Adresse')],
      }}
    >
      <WizardStep label={tx('Umfrage')} description={tx('Zu welcher offenen Umfrage möchtest du einladen?')}>
        <EntitySelectStep
          {...flow.picks.umfrage.select}
          {...flow.pick('umfrage')}
          searchPlaceholder={tx('Titel der Umfrage …')}
          avatar="none"
        />
      </WizardStep>
      <WizardStep label={tx('Teilnehmer')} description={tx('Wen möchtest du einladen?')} needs={['umfrage']}>
        <div className="space-y-4">
          <Bound form={flow.forms.teilnehmer} name="vorname" />
          <Bound form={flow.forms.teilnehmer} name="nachname" />
          <Bound form={flow.forms.teilnehmer} name="mail" />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'token', label: tx('Persönliches Token'), value: tx('Wird beim Einladen automatisch vergeben') }]}
            whatHappensNext={tx('Der Teilnehmer wird angelegt und erhält ein eigenes, nicht erratbares Token.')}
          />
        )}
      </WizardStep>
      {result && (
        <SuccessStep
          result={result}
          submit={flow.submit}
          forms={flow.formList}
          facts={facts}
          restartLabel={tx('Weiteren Teilnehmer einladen')}
          next={[
            { label: tx('Weiteren Teilnehmer einladen'), onClick: () => { flow.reset(); setStep(1); } },
            { label: tx('Umfrage abschließen'), href: '#/intents/umfrage-abschliessen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Gib dem Teilnehmer sein persönliches Token weiter, damit er antworten kann.')}
        />
      )}
    </IntentWizardShell>
  );
}
