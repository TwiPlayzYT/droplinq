import type { TutorialStepId } from '@/constants/tutorial';

const actionListeners = new Set<(id: string) => void>();
const stepListeners = new Set<(id: TutorialStepId | null) => void>();

let powerHoldOff = false;
let tutorialActive = false;

export function emitTourAction(id: string) {
  actionListeners.forEach((listener) => listener(id));
}

export function subscribeTourAction(listener: (id: string) => void) {
  actionListeners.add(listener);
  return () => {
    actionListeners.delete(listener);
  };
}

export function notifyTutorialStep(id: TutorialStepId | null) {
  stepListeners.forEach((listener) => listener(id));
}

export function subscribeTutorialStep(listener: (id: TutorialStepId | null) => void) {
  stepListeners.add(listener);
  return () => {
    stepListeners.delete(listener);
  };
}

export function setTutorialPowerHold(hold: boolean) {
  powerHoldOff = hold;
}

export function isTutorialPowerHold() {
  return powerHoldOff;
}

export function setTutorialSessionActive(value: boolean) {
  tutorialActive = value;
  if (!value) powerHoldOff = false;
}

export function isTutorialSessionActive() {
  return tutorialActive;
}
