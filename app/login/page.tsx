import LoginForm from '@/components/LoginForm'
import { getSystemSettings, getCompanySettings } from '@/app/actions/settings'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const sysSettings = await getSystemSettings()
  const companySettings = await getCompanySettings()
  
  return <LoginForm 
    loginBgUrl={sysSettings?.loginBgUrl || undefined} 
    companyName={companySettings?.name || 'My Company'} 
    logoUrl={sysSettings?.logoUrl || companySettings?.logoUrl || undefined}
  />
}
