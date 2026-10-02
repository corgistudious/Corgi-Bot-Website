import {Navigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {roleAtLeast} from '../lib/community';
export default function RequireDeveloper({children}){
 const {user,profile,loading}=useAuth();
 if(loading)return <section className="page"><p>Loading…</p></section>;
 if(!user)return <Navigate to="/login" replace/>;
 if(!roleAtLeast(profile?.role,'developer'))return <section className="page"><div className="notice">⛔ Developer access required.</div></section>;
 return children;
}
