export function SchoolCalendarBrandMark() {
  return <>
    <img className="school-calendar-logo" src="/school-calendar-logo.png" alt="우리학교달력" width="120" height="36"/>
    <span className="school-calendar-beta">BETA</span>
  </>;
}

export function SchoolCalendarCaption({showInvitation = false}: {showInvitation?: boolean}) {
  return <div className="header-brand-caption">
    <p className="header-caption">우리 학교 열두 달의 이야기</p>
    {showInvitation && <p className="header-caption-subtitle">우리학교인쇄에서 직접 만들어 보세요.</p>}
  </div>;
}
