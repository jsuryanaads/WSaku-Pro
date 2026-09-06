import { supabase } from './supabase'

export async function getWorkspaceMembers(userId) {
  const { data: membership, error } = await supabase.from('workspace_members').select('workspace_id, role, workspaces(id,name,workspace_type,description,owner_id)').eq('user_id', userId).limit(1).single()
  if (error) throw error
  const { data: members, error: memberError } = await supabase.rpc('get_workspace_members', { p_workspace_id: membership.workspace_id })
  if (memberError) throw memberError
  return { workspace: membership.workspaces, myRole: membership.role, members: members ?? [] }
}

export async function updateProfile(userId, fullName) {
  const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', userId)
  if (error) throw error
}

export async function updateMemberRole(workspaceId, userId, role) {
  const { error } = await supabase.from('workspace_members').update({ role }).eq('workspace_id', workspaceId).eq('user_id', userId)
  if (error) throw error
}

export async function setMemberActive(userId, active) {
  const { error } = await supabase.from('profiles').update({ is_active: active }).eq('id', userId)
  if (error) throw error
}
