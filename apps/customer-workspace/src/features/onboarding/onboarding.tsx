'use client';

import {useEffect, useRef, useState} from 'react';
import type {CatalogResponse, SchoolInput, TemplateCard} from '@/lib/api/contracts';
import {emptySchoolInput, validateSchoolInput, visibleSchoolValues} from '@/lib/api/school-input';
import {Button} from '@/components/ui/button';
import {Panel} from '@/components/ui/panel';
import {TextField} from '@/components/ui/text-field';

type Step = 'catalog' | 'detail' | 'guide' | 'school' | 'input-review' | 'projects';

export function Onboarding() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState('');
  const [request, setRequest] = useState(0);
  const [step, setStep] = useState<Step>('catalog');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [school, setSchool] = useState<SchoolInput>({values: {}, hidden: []});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);
  const selected = catalog?.templates.find(template => template.id === selectedId) || null;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setFailure('');
    fetch('/api/workspace/catalog', {signal: controller.signal})
      .then(async response => {
        if (!response.ok) throw new Error('catalog unavailable');
        const result = await response.json() as CatalogResponse;
        if (result.mode !== 'review' || !Array.isArray(result.templates)) throw new Error('invalid catalog');
        setCatalog(result);
      })
      .catch(error => {if (error.name !== 'AbortError') setFailure('디자인 목록을 불러오지 못했어요. 다시 시도해 주세요.');})
      .finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, [request]);

  useEffect(() => {
    if (started.current) {headingRef.current?.focus(); window.scrollTo({top: 0, behavior: 'instant'});}
    started.current = true;
  }, [step]);

  useEffect(() => {
    const dialog = previewRef.current;
    if (previewOpen && dialog && !dialog.open) dialog.showModal();
    if (!previewOpen && dialog?.open) dialog.close();
  }, [previewOpen]);

  function choose(template: TemplateCard) {
    if (selectedId !== template.id) {setSchool(emptySchoolInput(template.fields)); setErrors({});}
    setSelectedId(template.id); setStep('detail');
  }
  function catalogHome() {
    if (Object.values(school.values).some(value => value.trim()) && !window.confirm('입력한 자료는 아직 저장되지 않았어요. 디자인 목록으로 이동할까요?')) return;
    setStep('catalog');
  }
  function openPreview(index: number) {setPreviewIndex(index); setPreviewOpen(true);}
  function continueSchool(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const issues = validateSchoolInput(selected.fields, school);
    setErrors(issues);
    if (Object.keys(issues).length) {
      window.requestAnimationFrame(() => document.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus());
    } else setStep('input-review');
  }
  const heading = (eyebrow: string, title: string, description: string) => <div className="section-heading"><p className="eyebrow">{eyebrow}</p><h1 ref={headingRef} tabIndex={-1}>{title}</h1><p className="muted">{description}</p></div>;

  return <div className="workspace">
    <header className="site-header"><div className="header-inner"><Button variant="quiet" className="brand" onClick={catalogHome}>우리학교<span>달력</span></Button><p className="header-caption">우리 학교의 일 년을 담아요</p><Button onClick={() => setStep('projects')}>내 프로젝트</Button></div></header>
    <div className="review-notice"><div>{catalog?.notice || '신규 서비스 개발 검토용 · 실제 로그인·서버 저장·주문은 연결 전입니다.'}</div></div>
    <main className="main">
      {loading && <Panel className="state-panel"><h1>디자인을 준비하고 있어요</h1><p className="muted" role="status">잠시만 기다려 주세요.</p></Panel>}
      {!loading && failure && <Panel className="state-panel"><h1>목록을 다시 불러올게요</h1><p role="alert">{failure}</p><Button variant="primary" onClick={() => setRequest(value => value + 1)}>다시 시도하기</Button></Panel>}
      {!loading && !failure && catalog && step === 'catalog' && <>
        <section className="hero"><div><span className="badge">2027학년도 · 우리 학교 맞춤 달력</span><h1 ref={headingRef} tabIndex={-1}>디자인은 골라주세요.<br /><em>우리 학교 달력</em>으로<br />완성해 드려요.</h1><p className="muted hero-copy">학교 정보와 학사일정, 사진을 넣으면 돼요.<br />완성된 페이지를 확인하고 주문하세요.</p><ol className="journey"><li><span>1</span>디자인 선택</li><li><span>2</span>학교 자료 입력</li><li><span>3</span>확인 후 주문</li></ol></div>
          {catalog.templates[0] && <div className="hero-art"><PreviewImage url={catalog.templates[0].coverUrl} label="표지" /><PreviewImage className="hero-interior" url={catalog.templates[0].pages[4]?.imageUrl} label="월력 앞면" /><small>디자인 미리보기 연결 예정</small></div>}
        </section>
        <section aria-labelledby="catalog-title"><div className="catalog-heading"><div><h2 id="catalog-title">마음에 드는 디자인을 골라보세요</h2><p className="muted">학사달력 · 탁상형 · 전체 구성을 먼저 살펴볼 수 있어요.</p></div><span className="badge">{catalog.templates.length}종 선택 구성 검토</span></div>
          {!catalog.templates.length ? <Panel><h3>공개된 디자인을 준비 중이에요</h3><p className="muted">준비가 끝나면 이곳에서 고를 수 있어요.</p></Panel> : <div className="catalog-grid">{catalog.templates.map(template => <article className="template-card" key={template.id}>
            <div className="template-art"><PreviewImage url={template.coverUrl} label={template.name} /><span className="image-label">{template.previewKind === 'reference' ? '샘플 A · 연결 예정' : '선택 구성 예시'}</span><div className="mini-previews">{template.representativePages.map(number => <PreviewImage key={number} className="mini-placeholder" url={template.pages[number - 1].imageUrl} label={template.pages[number - 1].label} />)}<span>표지 · 월력 앞뒤<br />구성 참고</span></div></div>
            <div className="template-copy"><h3>{template.name}</h3><p>{template.description}</p><small>{template.note}</small><div className="card-actions"><span>{template.widthMm} × {template.heightMm} mm · {template.pageCount}면</span><Button onClick={() => choose(template)} aria-label={`${template.name} 전체면 살펴보기`}>전체면 살펴보기 →</Button></div></div>
          </article>)}</div>}
        </section>
        <section className="before-start"><div><h3>자료는 디자인을 고른 뒤 준비해도 괜찮아요.</h3><p className="muted">선택한 디자인에 필요한 자료를 안내해 드려요.</p></div><div><h3>만들던 달력이 있나요?</h3><Button variant="quiet" onClick={() => setStep('projects')}>내 프로젝트에서 이어하기 →</Button></div></section>
      </>}

      {!loading && !failure && selected && step === 'detail' && <>
        <Button variant="quiet" onClick={catalogHome}>← 디자인 목록</Button>
        {heading(selected.name, '표지부터 마지막 장까지 살펴보세요', '크게 보고 싶은 페이지를 누르세요. 아직 프로젝트는 생성하지 않습니다.')}
        <div className="detail-grid"><Panel><button className="large-preview" onClick={() => openPreview(0)} aria-label="표지 크게 보기"><PreviewImage url={selected.pages[0].imageUrl} label="표지" /><span>크게 보기 ↗</span></button></Panel><Panel><span className="badge">학사달력 · 탁상형</span><h2>{selected.name}</h2><p className="muted">{selected.description}</p><dl className="facts"><div><dt>규격</dt><dd>{selected.widthMm} × {selected.heightMm} mm</dd></div><div><dt>전체 면수</dt><dd>{selected.pageCount}면</dd></div><div><dt>사용 기간</dt><dd>{selected.period}</dd></div></dl><p>{selected.note}</p><Button variant="primary" className="wide-button" onClick={() => setStep('guide')}>이 디자인으로 만들기</Button></Panel></div>
        <div className="reference-note">면수·페이지 이동과 화면 구성을 확인할 수 있습니다. PDF에서 추출한 참고 이미지의 GitHub 저장은 승인 대기 중이어서 이 배포에는 포함하지 않았습니다.</div>
        <section className="all-pages" aria-labelledby="all-pages-title"><h2 id="all-pages-title">전체 {selected.pageCount}면 구성</h2><p className="muted">{selected.composition.map(item => `${item.label} ${item.count}면`).join(' · ')}</p><div className="page-grid">{selected.pages.map((page, index) => <button className="page-thumbnail" key={page.number} onClick={() => openPreview(index)} aria-label={`${page.number}면 ${page.label} 크게 보기`}><PreviewImage url={page.imageUrl} label={`${page.number}면`} /><span>{page.number}면 · {page.label}</span></button>)}</div></section>
      </>}

      {!loading && !failure && selected && step === 'guide' && <>
        <Progress />{heading(`선택한 디자인 · ${selected.name}`, '학교 자료를 넣어볼까요?', '필요한 자료를 먼저 안내해 드릴게요.')}
        <div className="guide-list"><GuideRow number="1" title="학교 정보" text={`${selected.fields.filter(field => field.required).map(field => field.label).join(', ')}은 필수예요. 나머지 항목은 표시 여부를 고를 수 있어요.`} /><GuideRow number="2" title="학사일정" text="가지고 계신 일정 파일을 올리고 날짜와 내용을 확인해요." /><GuideRow number="3" title="학교 사진" text={selected.photoGuide} /></div>
        <div className="reference-note">이번 구현에서는 학교 기본 정보 입력까지 확인할 수 있어요. 학사일정 파일 분석·사진 업로드·에디터 연결은 다음 구현 범위입니다.</div>
        <div className="actions"><Button onClick={() => setStep('detail')}>← 디자인 다시 보기</Button><Button variant="primary" onClick={() => setStep('school')}>학교 정보부터 넣기</Button></div>
      </>}

      {!loading && !failure && selected && step === 'school' && <>
        <Progress />{heading('학교 자료 입력 · 1 / 3', '학교 정보를 한 번만 입력해 주세요', '달력에 사용할 정보와 표시 여부를 입력해 보세요.')}
        <form onSubmit={continueSchool} noValidate>
          {(['basic', 'contact'] as const).map(group => <Panel className="form-section" key={group}><h2>{group === 'basic' ? '학교 기본 정보' : '학교 연락처'}</h2><div className="form-grid">{selected.fields.filter(field => field.group === group).map(field => <TextField key={field.key} label={field.label} value={school.values[field.key] || ''} required={field.required} hidden={school.hidden.includes(field.key)} allowHide={field.allowHide} maxLength={field.maxLength} hint={field.hint} error={errors[field.key]}
            onChange={value => {setSchool(current => ({...current, values: {...current.values, [field.key]: value}})); setErrors(current => ({...current, [field.key]: ''}));}}
            onHide={hidden => {setSchool(current => ({...current, hidden: hidden ? [...current.hidden.filter(key => key !== field.key), field.key] : current.hidden.filter(key => key !== field.key)})); setErrors(current => ({...current, [field.key]: ''}));}} />)}</div></Panel>)}
          <div className="reference-note">입력 내용은 현재 화면 안에서만 유지됩니다. 새로고침하거나 창을 닫으면 사라지며 서버에는 저장되지 않습니다. 실제 템플릿의 항목 설정·교표 등 학교 상징 업로드는 연결 전입니다.</div>
          {Object.values(errors).some(Boolean) && <p className="field-error" role="alert">입력이 필요한 항목을 확인해 주세요.</p>}
          <div className="actions"><Button onClick={() => setStep('guide')}>← 준비 자료 안내</Button><Button type="submit" variant="primary">입력 내용 확인하기</Button></div>
        </form>
      </>}

      {!loading && !failure && selected && step === 'input-review' && <>
        <Progress />{heading('학교 정보 입력 확인', '입력한 내용이 맞나요?', '현재는 입력 흐름 검토 단계이며 저장·달력 반영은 아직 실행하지 않습니다.')}
        <Panel><h2>{school.values.name}</h2><dl className="facts">{selected.fields.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{school.hidden.includes(field.key) ? '달력에 표시하지 않음' : visibleSchoolValues(selected.fields, school)[field.key] || '미입력'}</dd></div>)}</dl></Panel>
        <div className="reference-note">다음은 학사일정·사진 입력과 동일 에디터 엔진 연결입니다. 실제 저장이 완료되기 전에는 ‘저장 완료’로 표시하지 않습니다.</div>
        <div className="actions"><Button onClick={() => setStep('school')}>← 학교 정보 수정</Button><Button disabled>학사일정 입력 · 연결 예정</Button></div>
      </>}

      {!loading && !failure && step === 'projects' && <>
        {heading('내 프로젝트', '작업을 이어갈 수 있는 공간이에요', '로그인과 프로젝트 서버 저장은 아직 연결하지 않았습니다.')}
        <Panel className="state-panel"><h2>서버에 저장된 프로젝트를 연결할 예정이에요</h2><p className="muted">현재 입력한 내용이 있다면 새로고침하기 전까지 돌아가 확인할 수 있어요.</p><div className="actions"><Button onClick={() => setStep(selected ? 'school' : 'catalog')}>{selected ? '입력하던 화면으로' : '디자인 보기'}</Button></div></Panel>
      </>}
    </main>
    <footer className="site-footer"><span>학교 자료만 준비하세요. 디자인은 이미 완성되어 있어요.</span><span>개발 검토용 · 실제 주문 서비스 아님</span></footer>

    <dialog ref={previewRef} className="preview-dialog" onCancel={() => setPreviewOpen(false)} onClose={() => setPreviewOpen(false)} aria-labelledby="preview-title" onKeyDown={event => {
      if (event.key === 'ArrowRight' && selected) setPreviewIndex(index => Math.min(selected.pages.length - 1, index + 1));
      if (event.key === 'ArrowLeft') setPreviewIndex(index => Math.max(0, index - 1));
    }}>
      {selected && <><div className="preview-header"><div><h2 id="preview-title">{selected.pages[previewIndex]?.label}</h2><p className="muted">이미지 연결 대기 · {previewIndex + 1} / {selected.pageCount}면</p></div><Button onClick={() => setPreviewOpen(false)}>닫기 ×</Button></div><PreviewImage className="preview-image" url={selected.pages[previewIndex]?.imageUrl} label={selected.pages[previewIndex]?.label || '페이지'} /><div className="preview-controls"><Button disabled={previewIndex === 0} onClick={() => setPreviewIndex(index => index - 1)}>← 이전 면</Button><span aria-live="polite">{previewIndex + 1} / {selected.pageCount}</span><Button disabled={previewIndex === selected.pages.length - 1} onClick={() => setPreviewIndex(index => index + 1)}>다음 면 →</Button></div></>}
    </dialog>
  </div>;
}

function Progress() {return <ol className="journey progress"><li><span>1</span>디자인 선택</li><li aria-current="step"><span>2</span>학교 자료 입력</li><li><span>3</span>달력 확인</li></ol>;}
function GuideRow({number, title, text}: {number: string; title: string; text: string}) {return <Panel className="guide-row"><span className="guide-number">{number}</span><div><h2>{title}</h2><p className="muted">{text}</p></div></Panel>;}

function PreviewImage({url, label, className = ''}: {url?: string | null; label: string; className?: string}) {
  return url ? <img className={className} src={url} alt={`${label} 미리보기`} loading="lazy" /> : <div className={`preview-placeholder ${className}`} role="img" aria-label={`${label}: 이미지 연결 대기`}><strong>{label}</strong><span>미리보기 연결 대기</span></div>;
}
