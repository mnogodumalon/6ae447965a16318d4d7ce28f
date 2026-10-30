/**
 * Umfrage anlegen — 4-Schritt-Wizard.
 * Steps: 1) Umfragedaten (Titel, Beschreibung, Ort, Dauer, Frist) → 2) Organisator → 3) Terminvorschlag → 4) Prüfen & anlegen.
 * Reads: —. Writes: umfragen (status offen), terminvorschlaege (verknüpft mit der neuen Umfrage).
 * Composes: IntentWizardShell, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { useUmfrageAnlegenFlow } from '@/lib/journey/flows/UmfrageAnlegen';
import { tx } from '@/i18n';

export default function UmfrageAnlegenPage() {
  const [step, setStep] = useState(1);
  const flow = useUmfrageAnlegenFlow({
    steps: {
      titel: 1, beschreibung: 1, ort: 1, dauer_min: 1, frist: 1,
      orga_vorname: 2, orga_nachname: 2, orga_mail: 2,
      start: 3,
    },
  });

  return (
    <IntentWizardShell
      title={tx('Umfrage anlegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Lege eine Terminumfrage mit einem Terminvorschlag in einem Zug an.'),
        needs: [tx('Titel und Dauer der Umfrage'), tx('Deine Kontaktdaten'), tx('Beginn des Terminvorschlags')],
      }}
    >
      <WizardStep label={tx('Umfrage')} description={tx('Worum geht es, wo findet es statt und bis wann sollen Antworten kommen?')}>
        <div className="space-y-4">
          <Bound form={flow.forms.umfragen} name="titel" />
          <Bound form={flow.forms.umfragen} name="beschreibung" />
          <Bound form={flow.forms.umfragen} name="ort" />
          <Bound form={flow.forms.umfragen} name="dauer_min" hint={tx('In Minuten, z. B. 60')} />
          <Bound form={flow.forms.umfragen} name="frist" />
          <StepNav hideBack onNext={() => flow.validateStep(1)} nextStepLabel={tx('Organisator')} />
        </div>
      </WizardStep>
      <WizardStep label={tx('Organisator')} description={tx('Wer organisiert den Termin und ist erreichbar?')}>
        <div className="space-y-4">
          <Bound form={flow.forms.umfragen} name="orga_vorname" />
          <Bound form={flow.forms.umfragen} name="orga_nachname" />
          <Bound form={flow.forms.umfragen} name="orga_mail" />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Terminvorschlag')} />
        </div>
      </WizardStep>
      <WizardStep label={tx('Termin')} description={tx('Wann soll der Termin beginnen?')}>
        <div className="space-y-4">
          <Bound form={flow.forms.terminvorschlaege} name="start" />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'status', label: tx('Status'), value: tx('Offen') }]}
            whatHappensNext={tx('Die Umfrage wird als offen gespeichert und der Terminvorschlag damit verknüpft.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Teilnehmer einladen'), href: '#/intents/teilnehmer-einladen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Als Nächstes kannst du Teilnehmer zur Umfrage einladen.')}
        />
      )}
    </IntentWizardShell>
  );
}
