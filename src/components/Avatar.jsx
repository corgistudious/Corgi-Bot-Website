import { UserRound } from 'lucide-react';
export default function Avatar({ profile, size=42 }) {
  return <div className="avatar" style={{width:size,height:size}}>{profile?.avatar_url ? <img src={profile.avatar_url} alt=""/> : <UserRound size={Math.max(18,size*.48)}/>}</div>;
}
