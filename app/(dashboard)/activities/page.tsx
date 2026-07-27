import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ExportCSVButton from '@/components/ExportCSVButton'

export const metadata = {
  title: 'Activity Logs | Dashboard'
}

export default async function ActivitiesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const role = session.user.role
  const isDirector = role === 'DIRECTOR'
  const warehouseId = session.user.warehouseId

  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page as string || '1') || 1
  const take = 20
  const skip = (page - 1) * take

  let activities = []
  let totalCount = 0

  if (isDirector) {
    totalCount = await prisma.activityLog.count()
    activities = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        user: { select: { name: true, role: true, username: true } },
        warehouse: { select: { name: true } }
      }
    })
  } else if (warehouseId) {
    totalCount = await prisma.activityLog.count({ where: { warehouseId } })
    activities = await prisma.activityLog.findMany({
      where: { warehouseId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        user: { select: { name: true, role: true, username: true } },
        warehouse: { select: { name: true } }
      }
    })
  } else {
    // Edge case: not a director and no warehouse assigned
    totalCount = await prisma.activityLog.count({ where: { userId: session.user.id } })
    activities = await prisma.activityLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        user: { select: { name: true, role: true, username: true } },
        warehouse: { select: { name: true } }
      }
    })
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / take))

  const exportData = activities.map(act => ({
    Time: act.createdAt.toLocaleString(),
    User: act.user.name,
    Role: act.user.role,
    Action: act.action,
    Details: act.details || '',
    Location: act.warehouse?.name || 'Network'
  }))

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.5rem' }}>Activity Logs</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isDirector ? 'Viewing network-wide system activities.' : 'Viewing activities for your location.'}
          </p>
        </div>
        <ExportCSVButton data={exportData} filename="activity_logs" />
      </div>

      <div className="card animate-fade-in" style={{ padding: '0', overflow: 'hidden' }}>
        {activities.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No recent activities found.
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>TIME</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>USER</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>ACTION</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>DETAILS</th>
                  {isDirector && <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>LOCATION</th>}
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(activity.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-light)', fontSize: '0.9rem' }}>{activity.user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activity.user.role.replace('_', ' ')}</div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 500 }}>
                      {activity.action}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={activity.details || ''}>
                      {activity.details || '-'}
                    </td>
                    {isDirector && (
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {activity.warehouse?.name || 'Network'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: 'var(--bg-dark)', borderTop: '1px solid var(--border-color)' }}>
              {page > 1 ? (
                <Link 
                  href={`/activities?page=${page - 1}`}
                  className="btn"
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-light)', border: '1px solid var(--border-color)', textDecoration: 'none', transition: 'all 0.2s' }}
                >
                  Previous
                </Link>
              ) : (
                <button disabled style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-light)', border: '1px solid var(--border-color)', opacity: 0.5, cursor: 'not-allowed' }}>
                  Previous
                </button>
              )}
              
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
              
              {page < totalPages ? (
                <Link 
                  href={`/activities?page=${page + 1}`}
                  className="btn"
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-light)', border: '1px solid var(--border-color)', textDecoration: 'none', transition: 'all 0.2s' }}
                >
                  Next
                </Link>
              ) : (
                <button disabled style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-light)', border: '1px solid var(--border-color)', opacity: 0.5, cursor: 'not-allowed' }}>
                  Next
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
