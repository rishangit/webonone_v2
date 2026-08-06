import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

function write(rel, data) {
  const p = path.join(root, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  const body = typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`
  fs.writeFileSync(p, body)
  console.log('W', rel.replace(/\\/g, '/'))
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'))
}

const catalogExtras = {
  services: {
    en: {
      title: 'Services',
      description: 'Manage catalog services.',
      empty: 'No services yet',
      add: 'Add service',
      search: 'Search services…',
      loading: 'Loading services…',
      details: 'Service details',
      loadingService: 'Loading service…',
      verified: 'Verified',
      unverified: 'Unverified',
      singular: 'Service',
      sectionDescription: 'Name, status, and description',
      tags: 'Tags',
      tagsDescription: 'Labels linked to this service',
      time: 'Time',
      timeDescription: 'How this service is scheduled',
      metadata: 'Metadata',
      created: 'Created',
      updated: 'Updated',
      overview: 'Overview',
      gallery: 'Gallery',
      attributes: 'Attributes',
      noDescription: '—',
      unableToLoad: 'Unable to load service.',
    },
    si: {
      title: 'සේවා',
      description: 'නාමාවලි සේවා කළමනාකරණය කරන්න.',
      empty: 'තවම සේවා නැත',
      add: 'සේවාව එකතු කරන්න',
      search: 'සේවා සොයන්න…',
      loading: 'සේවා පූරණය වෙමින්…',
      details: 'සේවා විස්තර',
      loadingService: 'සේවාව පූරණය වෙමින්…',
      verified: 'සත්‍යාපිත',
      unverified: 'නොසත්‍යාපිත',
      singular: 'සේවාව',
      sectionDescription: 'නම, තත්ත්වය සහ විස්තරය',
      tags: 'ටැග්',
      tagsDescription: 'මෙම සේවාවට සම්බන්ධ ලේබල',
      time: 'කාලය',
      timeDescription: 'මෙම සේවාව කාලසටහන්ගත කරන ආකාරය',
      metadata: 'පාරදත්ත',
      created: 'නිර්මාණය කළේ',
      updated: 'යාවත්කාලීන කළේ',
      overview: 'දළ විශ්ලේෂණය',
      gallery: 'ගැලරිය',
      attributes: 'ගුණාංග',
      noDescription: '—',
      unableToLoad: 'සේවාව පූරණය කළ නොහැක.',
    },
  },
  spaces: {
    en: {
      title: 'Spaces',
      description: 'Manage catalog spaces.',
      empty: 'No spaces yet',
      add: 'Add space',
      search: 'Search spaces…',
      loading: 'Loading spaces…',
      details: 'Space details',
      loadingSpace: 'Loading space…',
      verified: 'Verified',
      unverified: 'Unverified',
      singular: 'Space',
      sectionDescription: 'Name, status, and description',
      tags: 'Tags',
      tagsDescription: 'Labels linked to this space',
      metadata: 'Metadata',
      created: 'Created',
      updated: 'Updated',
      overview: 'Overview',
      gallery: 'Gallery',
      attributes: 'Attributes',
      noDescription: '—',
      unableToLoad: 'Unable to load space.',
    },
    si: {
      title: 'අවකාශ',
      description: 'නාමාවලි අවකාශ කළමනාකරණය කරන්න.',
      empty: 'තවම අවකාශ නැත',
      add: 'අවකාශය එකතු කරන්න',
      search: 'අවකාශ සොයන්න…',
      loading: 'අවකාශ පූරණය වෙමින්…',
      details: 'අවකාශ විස්තර',
      loadingSpace: 'අවකාශය පූරණය වෙමින්…',
      verified: 'සත්‍යාපිත',
      unverified: 'නොසත්‍යාපිත',
      singular: 'අවකාශය',
      sectionDescription: 'නම, තත්ත්වය සහ විස්තරය',
      tags: 'ටැග්',
      tagsDescription: 'මෙම අවකාශයට සම්බන්ධ ලේබල',
      metadata: 'පාරදත්ත',
      created: 'නිර්මාණය කළේ',
      updated: 'යාවත්කාලීන කළේ',
      overview: 'දළ විශ්ලේෂණය',
      gallery: 'ගැලරිය',
      attributes: 'ගුණාංග',
      noDescription: '—',
      unableToLoad: 'අවකාශය පූරණය කළ නොහැක.',
    },
  },
  units: {
    en: {
      title: 'Units',
      description: 'Manage units of measure.',
      empty: 'No units yet',
      add: 'Add unit',
      search: 'Search units…',
      loading: 'Loading units…',
      verified: 'Verified',
      unverified: 'Unverified',
      deleteDescription:
        'This action cannot be undone. The unit will be permanently removed.',
    },
    si: {
      title: 'ඒකක',
      description: 'මිනුම් ඒකක කළමනාකරණය කරන්න.',
      empty: 'තවම ඒකක නැත',
      add: 'ඒකකය එකතු කරන්න',
      search: 'ඒකක සොයන්න…',
      loading: 'ඒකක පූරණය වෙමින්…',
      verified: 'සත්‍යාපිත',
      unverified: 'නොසත්‍යාපිත',
      deleteDescription: 'මෙම ක්‍රියාව අහෝසි කළ නොහැක. ඒකකය ස්ථිරව ඉවත් වේ.',
    },
  },
  attributes: {
    en: {
      title: 'Attributes',
      description: 'Manage catalog attributes.',
      empty: 'No attributes yet',
      add: 'Add attribute',
      search: 'Search attributes…',
      loading: 'Loading attributes…',
      verified: 'Verified',
      unverified: 'Unverified',
      valueType: 'Value type',
      number: 'Number',
      text: 'Text',
      deleteDescription:
        'This action cannot be undone. The attribute will be permanently removed.',
    },
    si: {
      title: 'ගුණාංග',
      description: 'නාමාවලි ගුණාංග කළමනාකරණය කරන්න.',
      empty: 'තවම ගුණාංග නැත',
      add: 'ගුණාංගය එකතු කරන්න',
      search: 'ගුණාංග සොයන්න…',
      loading: 'ගුණාංග පූරණය වෙමින්…',
      verified: 'සත්‍යාපිත',
      unverified: 'නොසත්‍යාපිත',
      valueType: 'අගය වර්ගය',
      number: 'අංකය',
      text: 'පෙළ',
      deleteDescription: 'මෙම ක්‍රියාව අහෝසි කළ නොහැක. ගුණාංගය ස්ථිරව ඉවත් වේ.',
    },
  },
}

for (const [ns, langs] of Object.entries(catalogExtras)) {
  write(`data/frontend/src/locales/en/${ns}.json`, langs.en)
  write(`data/frontend/src/locales/si/${ns}.json`, langs.si)
}

const tagsEn = readJson('data/frontend/src/locales/en/tags.json')
Object.assign(tagsEn, {
  details: 'Tag details',
  sectionDescription: 'Name, color, status, and description',
  metadata: 'Metadata',
  created: 'Created',
  updated: 'Updated',
  noDescription: '—',
})
write('data/frontend/src/locales/en/tags.json', tagsEn)
write('data/frontend/src/locales/si/tags.json', {
  title: 'ටැග්',
  description: 'නාමාවලි ටැග් කළමනාකරණය කරන්න.',
  empty: 'තවම ටැග් නැත',
  add: 'ටැග් එකතු කරන්න',
  search: 'ටැග් සොයන්න…',
  loading: 'ටැග් පූරණය වෙමින්…',
  verified: 'සත්‍යාපිත',
  unverified: 'නොසත්‍යාපිත',
  loadingDetail: 'ටැග් පූරණය වෙමින්…',
  singular: 'ටැග්',
  emptyFound: 'ටැග් හමු නොවීය.',
  refs: 'යොමු: {{count}}',
  actionsFor: '{{name}} සඳහා ක්‍රියා',
  viewDetails: 'විස්තර බලන්න',
  verify: 'සත්‍යාපනය කරන්න',
  deleteConfirm: '{{name}} මකන්නද?',
  deleteConfirmFallback: 'ටැග් මකන්නද?',
  deleteDescription: 'මෙම ක්‍රියාව අහෝසි කළ නොහැක. ටැග් ස්ථිරව ඉවත් වේ.',
  details: 'ටැග් විස්තර',
  sectionDescription: 'නම, වර්ණය, තත්ත්වය සහ විස්තරය',
  metadata: 'පාරදත්ත',
  created: 'නිර්මාණය කළේ',
  updated: 'යාවත්කාලීන කළේ',
  noDescription: '—',
})

write('payment/frontend/src/locales/en/shell.json', {
  brand: 'Payment',
  loading: 'Loading…',
  dashboard: 'Dashboard',
  dashboardDescription: 'System subscription billing overview',
  loadingDashboard: 'Loading dashboard…',
  memberDenied: 'Payment admin access requires a company admin or super admin role.',
  activeCompanies: 'Active companies',
  issued: 'Issued',
  pendingReview: 'Pending review',
  overdue: 'Overdue',
  paid: 'Paid',
  void: 'Void',
  outstanding: 'Outstanding',
  signInTitle: 'Sign in to Payment',
  signInDescription: 'You will be redirected to Identity to sign in securely.',
  continueToSignIn: 'Continue to sign in',
  signingIn: 'Signing in…',
})
write('payment/frontend/src/locales/si/shell.json', {
  brand: 'ගෙවීම්',
  loading: 'පූරණය වෙමින්…',
  dashboard: 'උපකරණ පුවරුව',
  dashboardDescription: 'පද්ධති දායකත්ව බිල්පත් දළ විශ්ලේෂණය',
  loadingDashboard: 'උපකරණ පුවරුව පූරණය වෙමින්…',
  memberDenied: 'ගෙවීම් පරිපාලක ප්‍රවේශයට සමාගම් පරිපාලක හෝ සුපිරි පරිපාලක භූමිකාවක් අවශ්‍යයි.',
  activeCompanies: 'සක්‍රීය සමාගම්',
  issued: 'නිකුත් කළ',
  pendingReview: 'සමාලෝචනයට බලාපොරොත්තු',
  overdue: 'කල් ඉකුත්',
  paid: 'ගෙවූ',
  void: 'අවලංගු',
  outstanding: 'නොගෙවූ',
  signInTitle: 'ගෙවීම් වෙත පිවිසෙන්න',
  signInDescription: 'ආරක්ෂිතව පිවිසීමට ඔබව Identity වෙත යොමු කෙරේ.',
  continueToSignIn: 'පිවිසීමට ඉදිරියට',
  signingIn: 'පිවිසෙමින්…',
})

const invEn = readJson('payment/frontend/src/locales/en/invoices.json')
Object.assign(invEn, {
  singular: 'Invoice',
  emptySystem: 'No system invoices yet.',
  unknownCompany: 'Unknown company',
  markPaid: 'Mark paid',
  rejectProof: 'Reject proof',
  voidAction: 'Void',
  refLabel: 'Ref {{ref}}',
  dueLabel: 'Due {{date}}',
  actionsFor: 'Actions for {{name}}',
  summary: 'Summary',
  lineItems: 'Line items',
  total: 'Total',
  company: 'Company',
  amount: 'Amount',
  period: 'Period',
  issuedLabel: 'Issued',
  due: 'Due',
  paidLabel: 'Paid',
  referenceTitle: 'Invoice reference number',
  referenceHint:
    'Include this reference in the transfer description so payment can be matched to this invoice.',
  referenceCopied: 'Reference copied',
  copyReference: 'Copy invoice reference number',
  copied: 'Copied',
  receipt: 'Invoice receipt',
  openReceipt: 'Open invoice receipt',
  document: 'Document',
  uploadDocument: 'Upload document',
  uploadHint: 'Upload your invoice receipt (PDF or image) to submit for review.',
  file: 'File',
  uploaded: 'Uploaded',
  receiptFallback: 'Receipt',
  proofSubmitted: 'Payment proof submitted',
  failedSubmitProof: 'Failed to submit payment proof',
  failedLoad: 'Failed to load invoice',
  couldNotCopy: 'Could not copy reference',
})
write('payment/frontend/src/locales/en/invoices.json', invEn)
write('payment/frontend/src/locales/si/invoices.json', {
  ...invEn,
  title: 'ඉන්වොයිස්',
  empty: 'තවම ඉන්වොයිස් නැත',
  emptySystem: 'තවම පද්ධති ඉන්වොයිස් නැත.',
  singular: 'ඉන්වොයිස්',
  markPaid: 'ගෙවූ ලෙස සලකුණු කරන්න',
  rejectProof: 'සාක්ෂි ප්‍රතික්ෂේප කරන්න',
  voidAction: 'අවලංගු කරන්න',
  summary: 'සාරාංශය',
  lineItems: 'අයිතම',
  total: 'එකතුව',
  company: 'සමාගම',
  amount: 'මුදල',
  period: 'කාල සීමාව',
  referenceTitle: 'ඉන්වොයිස් යොමු අංකය',
  receipt: 'ඉන්වොයිස් රිසිට්පත',
  uploadDocument: 'ලේඛනය උඩුගත කරන්න',
})

write('email/frontend/src/locales/en/shell.json', {
  brand: 'Email',
  loading: 'Loading…',
  dashboard: 'Dashboard',
  dashboardDescription: 'Email delivery summary and recent activity for your scope.',
  dashboardDescriptionMember: 'Your email activity overview.',
  loadingDashboard: 'Loading dashboard…',
  memberLimited:
    'Limited dashboard view. Contact an administrator for send and template management.',
  queuePending: 'Queue pending',
  failed24h: 'Failed (24h)',
  sent24h: 'Sent (24h)',
  recentActivity: 'Recent activity',
  noRecentMember: 'No recent email activity.',
  noRecent: 'No sends yet for your scope.',
  statusSent: 'Sent',
  statusFailed: 'Failed',
  allStatuses: 'All statuses',
  fromDate: 'From date',
  toDate: 'To date',
  startDate: 'Start date',
  endDate: 'End date',
  signInTitle: 'Sign in to Email',
  signInDescription: 'You will be redirected to Identity to sign in securely.',
  continueToSignIn: 'Continue to sign in',
  signingIn: 'Signing in…',
  historyTitle: 'Send history',
  historyDescription: 'Past email deliveries for your scope.',
  providersTitle: 'Email providers',
  providersDescription:
    'SMTP configuration (non-secret values). Passwords are stored in server environment only.',
  settingsTitle: 'Settings',
  settingsDescription: 'Email service settings for your company.',
  testTitle: 'Test email',
  testDescription: 'Send a test message using a template to verify delivery.',
})
write('email/frontend/src/locales/si/shell.json', {
  brand: 'ඊමේල්',
  loading: 'පූරණය වෙමින්…',
  dashboard: 'උපකරණ පුවරුව',
  dashboardDescription: 'ඔබේ විෂය පථය සඳහා ඊමේල් බෙදාහැරීමේ සාරාංශය සහ මෑත ක්‍රියාකාරකම්.',
  dashboardDescriptionMember: 'ඔබේ ඊමේල් ක්‍රියාකාරකම් දළ විශ්ලේෂණය.',
  loadingDashboard: 'උපකරණ පුවරුව පූරණය වෙමින්…',
  memberLimited: 'සීමිත උපකරණ පුවරුව. යැවීම සහ සැකිලි කළමනාකරණය සඳහා පරිපාලකයෙකු අමතන්න.',
  queuePending: 'පෝලිමේ බලාපොරොත්තු',
  failed24h: 'අසාර්ථක (පැය 24)',
  sent24h: 'යැවූ (පැය 24)',
  recentActivity: 'මෑත ක්‍රියාකාරකම්',
  noRecentMember: 'මෑත ඊමේල් ක්‍රියාකාරකම් නැත.',
  noRecent: 'ඔබේ විෂය පථය සඳහා තවම යැවීම් නැත.',
  statusSent: 'යැවූ',
  statusFailed: 'අසාර්ථක',
  allStatuses: 'සියලු තත්ත්ව',
  fromDate: 'ආරම්භ දිනය',
  toDate: 'අවසාන දිනය',
  startDate: 'ආරම්භ දිනය',
  endDate: 'අවසාන දිනය',
  signInTitle: 'ඊමේල් වෙත පිවිසෙන්න',
  signInDescription: 'ආරක්ෂිතව පිවිසීමට ඔබව Identity වෙත යොමු කෙරේ.',
  continueToSignIn: 'පිවිසීමට ඉදිරියට',
  signingIn: 'පිවිසෙමින්…',
  historyTitle: 'යැවීම් ඉතිහාසය',
  historyDescription: 'ඔබේ විෂය පථය සඳහා පෙර ඊමේල් බෙදාහැරීම්.',
  providersTitle: 'ඊමේල් සපයන්නන්',
  providersDescription: 'SMTP වින්‍යාසය (රහස් නොවන අගයන්). මුරපද සර්වර් පරිසරයේ පමණක් ගබඩා වේ.',
  settingsTitle: 'සැකසුම්',
  settingsDescription: 'ඔබේ සමාගම සඳහා ඊමේල් සේවා සැකසුම්.',
  testTitle: 'පරීක්ෂණ ඊමේල්',
  testDescription: 'බෙදාහැරීම තහවුරු කිරීමට සැකිල්ලක් භාවිතයෙන් පරීක්ෂණ පණිවිඩයක් යවන්න.',
})

write('sms/frontend/src/locales/en/shell.json', {
  brand: 'SMS',
  loading: 'Loading…',
  dashboard: 'Dashboard',
  dashboardDescription: 'SMS delivery summary for your scope.',
  loadingDashboard: 'Loading dashboard…',
  queuePending: 'Queue pending',
  failed24h: 'Failed (24h)',
  sent24h: 'Sent (24h)',
  approvedDevices: 'Approved devices',
  signInTitle: 'Sign in to SMS',
  signInDescription: 'You will be redirected to Identity to sign in securely.',
  continueToSignIn: 'Continue to sign in',
  signingIn: 'Signing in…',
  historyTitle: 'Send history',
  historyDescription: 'Past SMS deliveries for your scope.',
})
write('sms/frontend/src/locales/si/shell.json', {
  brand: 'SMS',
  loading: 'පූරණය වෙමින්…',
  dashboard: 'උපකරණ පුවරුව',
  dashboardDescription: 'ඔබේ විෂය පථය සඳහා SMS බෙදාහැරීමේ සාරාංශය.',
  loadingDashboard: 'උපකරණ පුවරුව පූරණය වෙමින්…',
  queuePending: 'පෝලිමේ බලාපොරොත්තු',
  failed24h: 'අසාර්ථක (පැය 24)',
  sent24h: 'යැවූ (පැය 24)',
  approvedDevices: 'අනුමත උපාංග',
  signInTitle: 'SMS වෙත පිවිසෙන්න',
  signInDescription: 'ආරක්ෂිතව පිවිසීමට ඔබව Identity වෙත යොමු කෙරේ.',
  continueToSignIn: 'පිවිසීමට ඉදිරියට',
  signingIn: 'පිවිසෙමින්…',
  historyTitle: 'යැවීම් ඉතිහාසය',
  historyDescription: 'ඔබේ විෂය පථය සඳහා පෙර SMS බෙදාහැරීම්.',
})

write('media/frontend/src/locales/en/shell.json', {
  brand: 'Media',
  loading: 'Loading…',
  signInTitle: 'Sign in to Media',
  signInDescription: 'You will be redirected to Identity to sign in securely.',
  continueToSignIn: 'Continue to sign in',
  signingIn: 'Signing in…',
  waitingAuth: 'Waiting for authentication…',
})
write('media/frontend/src/locales/si/shell.json', {
  brand: 'මාධ්‍ය',
  loading: 'පූරණය වෙමින්…',
  signInTitle: 'මාධ්‍ය වෙත පිවිසෙන්න',
  signInDescription: 'ආරක්ෂිතව පිවිසීමට ඔබව Identity වෙත යොමු කෙරේ.',
  continueToSignIn: 'පිවිසීමට ඉදිරියට',
  signingIn: 'පිවිසෙමින්…',
  waitingAuth: 'සත්‍යාපනය සඳහා බලාපොරොත්තු වෙමින්…',
})
write('media/frontend/src/locales/en/picker.json', {
  title: 'Choose media',
  confirm: 'Select',
  embedTitle: 'Media picker',
  waitingAuth: 'Waiting for authentication…',
})
write('media/frontend/src/locales/si/picker.json', {
  title: 'මාධ්‍ය තෝරන්න',
  confirm: 'තෝරන්න',
  embedTitle: 'මාධ්‍ය තෝරකය',
  waitingAuth: 'සත්‍යාපනය සඳහා බලාපොරොත්තු වෙමින්…',
})
write('media/frontend/src/locales/en/upload.json', {
  title: 'Upload',
  submit: 'Upload',
  waitingAuth: 'Waiting for authentication…',
})
write('media/frontend/src/locales/si/upload.json', {
  title: 'උඩුගත කරන්න',
  submit: 'උඩුගත කරන්න',
  waitingAuth: 'සත්‍යාපනය සඳහා බලාපොරොත්තු වෙමින්…',
})
write('media/frontend/src/locales/si/library.json', {
  title: 'මාධ්‍ය පුස්තකාලය',
  description: 'ඔබේ විෂය පථ පුස්තකාලයේ ගොනු පිරික්සන්න, උඩුගත කරන්න සහ කළමනාකරණය කරන්න.',
  empty: 'තවම මාධ්‍ය නැත',
  loading: 'මාධ්‍ය පූරණය වෙමින්…',
  searchPlaceholder: 'මාධ්‍ය සොයන්න…',
  uploadFailed: 'උඩුගත කිරීම අසාර්ථක විය',
})

write('design/frontend/src/locales/en/shell.json', {
  brand: 'Design',
  loading: 'Loading…',
  signInTitle: 'Sign in to Design',
  signInDescription: 'You will be redirected to Identity to sign in securely.',
  continueToSignIn: 'Continue to sign in',
  signingIn: 'Signing in…',
})
write('design/frontend/src/locales/si/shell.json', {
  brand: 'නිර්මාණය',
  loading: 'පූරණය වෙමින්…',
  signInTitle: 'නිර්මාණය වෙත පිවිසෙන්න',
  signInDescription: 'ආරක්ෂිතව පිවිසීමට ඔබව Identity වෙත යොමු කෙරේ.',
  continueToSignIn: 'පිවිසීමට ඉදිරියට',
  signingIn: 'පිවිසෙමින්…',
})

const formsEn = readJson('design/frontend/src/locales/en/forms.json')
Object.assign(formsEn, {
  designerDescription: 'Add fields from the toolbox, then configure labels and options.',
  companyTemplates: 'Company form templates.',
  customerRequired: 'Customer is required.',
  unableToLoad: 'Unable to load form.',
  textField: 'Text field',
  textArea: 'Text area',
  checkbox: 'Checkbox',
  radioGroup: 'Radio group',
  dropdown: 'Dropdown',
  option1: 'Option 1',
  option2: 'Option 2',
  draft: 'Draft',
  published: 'Published',
  saved: 'Form saved',
})
write('design/frontend/src/locales/en/forms.json', formsEn)
write('design/frontend/src/locales/si/forms.json', {
  ...formsEn,
  title: 'පෝරම',
  empty: 'තවම පෝරම නැත',
  add: 'පෝරමය එකතු කරන්න',
  designer: 'පෝරම නිර්මාණකරු',
  search: 'පෝරම සොයන්න…',
  loading: 'පෝරම පූරණය වෙමින්…',
  formCreated: 'පෝරමය නිර්මාණය විය',
  fill: 'පෝරමය පුරවන්න',
  loadingForm: 'පෝරමය පූරණය වෙමින්…',
})

const shellEn = readJson('website/frontend/src/locales/en/shell.json')
Object.assign(shellEn, {
  openApp: 'Open app',
  userMenu: 'User menu',
  checkingSession: 'Checking session',
  login: 'Login',
})
write('website/frontend/src/locales/en/shell.json', shellEn)
const shellSi = readJson('website/frontend/src/locales/si/shell.json')
Object.assign(shellSi, {
  openApp: 'යෙදුම විවෘත කරන්න',
  userMenu: 'පරිශීලක මෙනුව',
  checkingSession: 'සැසිය පරීක්ෂා කරමින්',
  login: 'පිවිසෙන්න',
})
write('website/frontend/src/locales/si/shell.json', shellSi)

const searchEn = readJson('website/frontend/src/locales/en/search.json')
Object.assign(searchEn, {
  metersAway: '{{meters}} m away',
  kmAway: '{{km}} km away',
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
})
write('website/frontend/src/locales/en/search.json', searchEn)
const searchSi = readJson('website/frontend/src/locales/si/search.json')
Object.assign(searchSi, searchEn, {
  title: 'සෙවීම',
  placeholder: 'නම, විස්තරය හෝ ටැග් අනුව සොයන්න…',
  empty: 'ප්‍රතිඵල නැත',
  cta: 'සොයන්න',
  listView: 'ලැයිස්තුව',
  mapView: 'සිතියම',
  product: 'නිෂ්පාදනය',
  service: 'සේවාව',
  spaceKind: 'අවකාශය',
  getToken: 'ටෝකනය ලබාගන්න',
  loginRequired:
    'පෝලිම් ටෝකනයක් ලබාගැනීමට ඔබට පිවිසීමට අවශ්‍යයි. පිවිසීමෙන් පසු ඔබ මෙම පිටුවට ආපසු එනු ඇත.',
})
write('website/frontend/src/locales/si/search.json', searchSi)
write('website/frontend/src/locales/en/auth.json', {
  login: 'Sign in',
  logout: 'Log out',
  clearingSession: 'Signing out…',
})
write('website/frontend/src/locales/si/auth.json', {
  login: 'පිවිසෙන්න',
  logout: 'ඉවත් වන්න',
  clearingSession: 'ඉවත් වෙමින්…',
})
write('website/frontend/src/locales/si/home.json', {
  title: 'මුල් පිටුව',
  brand: 'WebOnOne',
  headline: 'ඔබට අවශ්‍ය දේ සොයන්න',
  subtitle: 'ඔබ අවට ව්‍යාපාරවලින් අවශ්‍ය සියල්ල එක තැනකින්.',
  searchPlaceholder: 'නම, විස්තරය හෝ ටැග් අනුව සොයන්න…',
  searchAria: 'නාමාවලිය සොයන්න',
  cta: 'සොයන්න',
})

const devEn = readJson('sms/frontend/src/locales/en/devices.json')
Object.assign(devEn, {
  title: 'Gateway devices',
  description:
    'Approve or revoke the phones that send SMS for your scope. Live status refreshes every 15 seconds.',
  loading: 'Loading devices…',
  refreshNow: 'Refresh now',
  empty: 'No devices yet',
  deleteDescription:
    'This action cannot be undone. The gateway device will lose permission to send SMS.',
})
write('sms/frontend/src/locales/en/devices.json', devEn)
write('sms/frontend/src/locales/si/devices.json', {
  ...devEn,
  title: 'ගේට්වේ උපාංග',
  empty: 'තවම උපාංග නැත',
  refreshNow: 'දැන් නැවුම් කරන්න',
  loading: 'උපාංග පූරණය වෙමින්…',
})

for (const svc of ['email', 'sms']) {
  const q = readJson(`${svc}/frontend/src/locales/en/queue.json`)
  write(`${svc}/frontend/src/locales/si/queue.json`, {
    ...q,
    title: 'පෝලිම',
    empty: 'පෝලිම හිස්ය',
    loading: 'පෝලිම පූරණය වෙමින්…',
    refreshNow: 'දැන් නැවුම් කරන්න',
    pending: 'බලාපොරොත්තු',
    processing: 'සකසමින්',
    failed: 'අසාර්ථක',
  })
}

const smsSend = {
  title: 'Send SMS',
  description: 'Compose a one-off SMS using a template or a freeform message.',
  submit: 'Send',
  loading: 'Loading send form…',
}
write('sms/frontend/src/locales/en/send.json', smsSend)
write('sms/frontend/src/locales/si/send.json', {
  title: 'SMS යවන්න',
  description: 'සැකිල්ලක් හෝ නිදහස් පණිවිඩයක් භාවිතයෙන් එක් වරක් SMS ලියන්න.',
  submit: 'යවන්න',
  loading: 'යැවීමේ පෝරමය පූරණය වෙමින්…',
})

console.log('done locales')
