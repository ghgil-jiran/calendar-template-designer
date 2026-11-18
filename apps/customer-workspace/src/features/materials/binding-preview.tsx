import {bindingPreviewRects} from '../editor/production-guide-geometry';
export function BindingPreview({width,height,enabled=true}:{width:number;height:number;enabled?:boolean}){
 if(!enabled||!(width>0&&height>0))return null;
 return <svg className="binding-preview-marks" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="타공 위치 미리보기"><title>타공 위치 참고 표시</title>{bindingPreviewRects(width,height).map((r,i)=><rect key={i} {...r} fill="#c6c8ca" fillOpacity=".55"/>)}</svg>;
}
