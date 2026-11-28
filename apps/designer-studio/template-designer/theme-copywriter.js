(() => {
    'use strict';

    function generateThemeCopy(title, description, referenceMonths, monthlyDirections = window.ThemeCurator.monthlyDirections) {
        const theme = [title, description].filter(Boolean).join(' — ');
        const months = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1, title: (i + 1) + '월',
            theme_text: /THE YEAR IN OBJECTS/i.test(title) ? referenceMonths[i].memo_title : monthlyDirections[i], concept_text: title + ' · ' + monthlyDirections[i],
            memo_title: '메모', prompt_subject: theme + ' · ' + (i + 1) + '월 · ' + monthlyDirections[i]
        }));
        return {theme, months};
    }

    const habitMonths = [
        ['내일도 할 수 있을 만큼 작게','오늘 한 만큼만 표시하기'],
        ['비어 있는 칸 다음에도 오늘이 있다','돌아온 날에 표시하기'],
        ['언제 할지 정하면 시작이 쉬워진다','정해둔 시간에 했나요?'],
        ['늘 하는 일 뒤에 새 습관을 붙이기','무엇을 한 뒤에 시작했나요?'],
        ['시작에 필요한 것을 눈에 보이게','내일 쓸 것을 미리 꺼내두기'],
        ['어렵다면 목표를 조금 줄여도 좋다','나에게 맞는 양을 찾아보기'],
        ['바쁜 날에 할 최소한을 정하기','작게라도 했다면 표시하기'],
        ['쉬는 날도 계획에 넣기','쉬고 돌아온 날에 표시하기'],
        ['새로운 목표 전에 지난 기록 보기','계속하고 싶은 한 가지 찾기'],
        ['혼자 하기 어렵다면 같이 약속하기','함께한 날도 한 칸에 담기'],
        ['결과가 더뎌도 해온 일을 보기','오늘 반복한 행동에 표시하기'],
        ['한 해 동안, 내가 다시 시작한 날들','내년에도 이어갈 한 가지 남기기']
    ];
    function applyHabitCopy(draft, previous) {
        draft.cover.title = previous?.cover.title ?? '하루만큼, 꾸준히';
        draft.cover.cover_subtitle ||= '나에게 맞는 속도로, 하루 한 칸.';
        draft.back_cover.title = previous?.back_cover?.title ?? '내일도 한 칸부터';
        draft.inside_copy = previous?.inside_copy ?? {annual:'한 해를 한눈에',scheduler:'이번 달에 지킬 한 가지'};
        const previousMonths = new Map(previous?.months.map(month=>[month.month,month]));
        draft.months = draft.months.map((month,i)=>{
            const saved = previousMonths.get(month.month);
            return {...month,front_text:saved?.front_text ?? habitMonths[i][0],back_text:saved?.back_text ?? habitMonths[i][1],
                scheduler_text:saved?.scheduler_text ?? habitMonths[i][1],prompt_subject:saved?.prompt_subject ?? '체크박스와 빈 칸으로 표현하는 일일 기록 그래픽'};
        });
    }

    function recommendCoverTitle(draft, language) {
        const theme = draft.title.replace(/\b2027\b/g, '').trim().slice(0, 32);
        const english = language === 'en' || (language !== 'ko' && !/[가-힣]/.test(theme));
        const titles = english ? [theme, 'A Year of ' + theme, theme + ' in Twelve Months']
            : [theme, theme + '의 열두 달', '한 해의 ' + theme];
        const alternatives = [...new Set(titles.filter(title => title && title.length <= 48))];
        return alternatives[(alternatives.indexOf(draft.cover.title) + 1) % alternatives.length] ?? draft.cover.title;
    }

    function describeDraftCopy(draft) {
        return {
            cover:{title:draft.cover?.title, subtitle:draft.cover?.cover_subtitle},
            backCover:draft.back_cover?.title,
            inside:draft.inside_copy,
            months:draft.months?.map(month => ({
                month:month.month, front:month.front_text ?? month.theme_text,
                back:month.back_text, scheduler:month.scheduler_text
            })) ?? []
        };
    }

    window.ThemeCopywriter = Object.freeze({generateThemeCopy, recommendCoverTitle, describeDraftCopy, habitMonths, applyHabitCopy});
})();
