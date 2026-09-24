import { AlertTriangle, LoaderCircle, RefreshCcw } from 'lucide-react';
export function LoadingState({label='Đang tải dữ liệu…'}){return <div className="api-state"><LoaderCircle className="spin" size={22}/><span>{label}</span></div>}
export function ErrorState({error,onRetry}){return <div className="api-state error"><AlertTriangle size={22}/><div><b>Không thể tải dữ liệu</b><span>{String(error?.message||error||'UNKNOWN_ERROR')}</span></div>{onRetry&&<button className="small-btn" onClick={onRetry}><RefreshCcw size={14}/> Thử lại</button>}</div>}
