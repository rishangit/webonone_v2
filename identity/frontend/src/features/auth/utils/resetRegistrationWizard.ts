import { clearRegistrationEmail } from './registrationEmailStorage'
import { clearRegistrationSessionToken } from './registrationSessionStorage'

export function clearRegistrationWizardStorage(): void {
  clearRegistrationEmail()
  clearRegistrationSessionToken()
}
