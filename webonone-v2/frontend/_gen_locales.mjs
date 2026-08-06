/**
 * Generates expanded webonone-v2 locale JSON (en + si) from a shared key map.
 * Run: node _gen_locales.mjs
 */
import fs from 'fs'
import path from 'path'

const out = path.resolve('src/locales')

/** @type {Record<string, Record<string, {en: string, si: string}>>} */
const packs = {
  shell: {
    brand: { en: 'WebOnOne', si: 'WebOnOne' },
    'nav.home': { en: 'Home', si: 'මුල් පිටුව' },
    'nav.calendar': { en: 'Calendar', si: 'දින දර්ශනය' },
    'nav.schedule': { en: 'Schedule', si: 'කාලසටහන' },
    'nav.events': { en: 'Events', si: 'සිදුවීම්' },
    'nav.staff': { en: 'Staff', si: 'කාර්ය මණ්ඩලය' },
    'nav.settings': { en: 'Settings', si: 'සැකසුම්' },
    'nav.companies': { en: 'Companies', si: 'සමාගම්' },
    'nav.myCompanies': { en: 'My Companies', si: 'මගේ සමාගම්' },
    'nav.connectedCompanies': { en: 'Connected Companies', si: 'සම්බන්ධ සමාගම්' },
    'nav.catalog': { en: 'Catalog', si: 'නාමාවලිය' },
    'nav.data': { en: 'Data', si: 'දත්ත' },
    'nav.email': { en: 'Email', si: 'විද්‍යුත් තැපෑල' },
    'nav.sms': { en: 'SMS', si: 'SMS' },
    'nav.payment': { en: 'Payment', si: 'ගෙවීම්' },
    'nav.design': { en: 'Design', si: 'නිර්මාණය' },
    'nav.profile': { en: 'Profile', si: 'පැතිකඩ' },
    'nav.identity': { en: 'Identity', si: 'අනන්‍යතාව' },
    'nav.basicSettings': { en: 'Basic settings', si: 'මූලික සැකසුම්' },
    'nav.systemTheme': { en: 'System Theme', si: 'පද්ධති තේමාව' },
    'nav.products': { en: 'Products', si: 'නිෂ්පාදන' },
    'nav.services': { en: 'Services', si: 'සේවා' },
    'nav.spaces': { en: 'Spaces', si: 'අවකාශ' },
    'nav.tags': { en: 'Tags', si: 'ටැග්' },
    'nav.units': { en: 'Units', si: 'ඒකක' },
    'nav.attributes': { en: 'Attributes', si: 'ගුණාංග' },
    'nav.users': { en: 'Users', si: 'පරිශීලකයින්' },
    'nav.send': { en: 'Send', si: 'යවන්න' },
    'nav.queue': { en: 'Queue', si: 'පෝලිම' },
    'nav.history': { en: 'History', si: 'ඉතිහාසය' },
    'nav.templates': { en: 'Templates', si: 'සැකිලි' },
    'nav.devices': { en: 'Devices', si: 'උපාංග' },
    'nav.invoices': { en: 'Invoices', si: 'ඉන්වොයිස්' },
    'nav.forms': { en: 'Forms', si: 'පෝරම' },
    loading: { en: 'Loading…', si: 'පූරණය වෙමින්…' },
    loadingPage: { en: 'Loading page…', si: 'පිටුව පූරණය වෙමින්…' },
    loadingSession: { en: 'Loading session…', si: 'සැසිය පූරණය වෙමින්…' },
    loadingPeer: { en: 'Loading {{peer}}…', si: '{{peer}} පූරණය වෙමින්…' },
    selectAccount: { en: 'Select an account to continue', si: 'ඉදිරියට යාමට ගිණුමක් තෝරන්න' },
    waitingAuth: { en: 'Waiting for authentication...', si: 'සත්‍යාපනය සඳහා රැඳෙමින්...' },
    confirmDelete: { en: 'This action cannot be undone.', si: 'මෙම ක්‍රියාව අහෝසි කළ නොහැක.' },
  },
  auth: {
    loginTitle: { en: 'Sign in', si: 'පිවිසෙන්න' },
    loginSubtitle: { en: 'Sign in to continue to WebOnOne', si: 'WebOnOne වෙත ඉදිරියට යාමට පිවිසෙන්න' },
    welcome: { en: 'Welcome, {{name}}!', si: 'සාදරයෙන් පිළිගනිමු, {{name}}!' },
    signedInAs: { en: 'Signed in as {{name}}', si: '{{name}} ලෙස පිවිසී ඇත' },
    callbackError: { en: 'Could not complete sign-in', si: 'පිවිසීම සම්පූර්ණ කළ නොහැකි විය' },
    sessionExpired: { en: 'Your session has expired', si: 'ඔබගේ සැසිය කල් ඉකුත් වී ඇත' },
    checkingSession: { en: 'Checking session…', si: 'සැසිය පරීක්ෂා කරමින්…' },
    silentSsoTitle: { en: 'Identity silent SSO', si: 'Identity නිහඬ SSO' },
    completingSignIn: { en: 'Completing sign in…', si: 'පිවිසීම සම්පූර්ණ කරමින්…' },
    signingOut: { en: 'Signing out…', si: 'ඉවත් වෙමින්…' },
    returningToWebsite: { en: 'Returning to website…', si: 'වෙබ් අඩවියට ආපසු යමින්…' },
    backToSignIn: { en: 'Back to sign in', si: 'පිවිසීමට ආපසු' },
    missingAuthResponse: { en: 'Missing authorization response', si: 'අවසර ප්‍රතිචාරය නැත' },
    invalidSignInSession: { en: 'Invalid or expired sign-in session', si: 'අවලංගු හෝ කල් ඉකුත් වූ පිවිසුම් සැසිය' },
    brand: { en: 'WebOnOne', si: 'WebOnOne' },
  },
  home: {
    title: { en: 'Home', si: 'මුල් පිටුව' },
    welcome: { en: 'Welcome, {{name}}!', si: 'සාදරයෙන් පිළිගනිමු, {{name}}!' },
    welcomeFallbackName: { en: 'User', si: 'පරිශීලක' },
    description: { en: 'You are signed in to WebOnOne.', si: 'ඔබ WebOnOne වෙත පිවිසී ඇත.' },
    sessionActive: { en: 'Session active with Bearer JWT.', si: 'Bearer JWT සමඟ සැසිය සක්‍රියයි.' },
    notSignedIn: { en: 'Not signed in.', si: 'පිවිසී නැත.' },
  },
  session: {
    chooseAccount: { en: 'Choose account', si: 'ගිණුම තෝරන්න' },
    chooseRole: { en: 'Choose how you want to continue', si: 'ඉදිරියට යන ආකාරය තෝරන්න' },
    continue: { en: 'Continue', si: 'ඉදිරියට' },
    noRoles: { en: 'No roles available for this account', si: 'මෙම ගිණුමට භූමිකා නැත' },
    switchAccountDescription: {
      en: 'Switch which account to use for this WebOnOne session.',
      si: 'මෙම WebOnOne සැසිය සඳහා භාවිතා කරන ගිණුම මාරු කරන්න.',
    },
    selectAccountDescription: {
      en: 'Select which account to use for this WebOnOne session. Your choice stays active until you log out.',
      si: 'මෙම WebOnOne සැසිය සඳහා භාවිතා කරන ගිණුම තෝරන්න. ඔබ ඉවත් වන තුරු තේරීම සක්‍රියව පවතී.',
    },
    companySessionRequired: { en: 'Company session required.', si: 'සමාගම් සැසිය අවශ්‍යයි.' },
  },
  profile: {
    title: { en: 'Profile', si: 'පැතිකඩ' },
    openProfile: { en: 'Open profile', si: 'පැතිකඩ විවෘත කරන්න' },
  },
}

function setPath(obj, keyPath, value) {
  const parts = keyPath.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] ??= {}
    cur = cur[parts[i]]
  }
  cur[parts[parts.length - 1]] = value
}

function writePack(ns, flat) {
  const en = {}
  const si = {}
  for (const [k, v] of Object.entries(flat)) {
    setPath(en, k, v.en)
    setPath(si, k, v.si)
  }
  fs.mkdirSync(path.join(out, 'en'), { recursive: true })
  fs.mkdirSync(path.join(out, 'si'), { recursive: true })
  fs.writeFileSync(path.join(out, 'en', `${ns}.json`), JSON.stringify(en, null, 2) + '\n')
  fs.writeFileSync(path.join(out, 'si', `${ns}.json`), JSON.stringify(si, null, 2) + '\n')
}

for (const [ns, flat] of Object.entries(packs)) {
  writePack(ns, flat)
}
console.log('Wrote starter packs:', Object.keys(packs).join(', '))
