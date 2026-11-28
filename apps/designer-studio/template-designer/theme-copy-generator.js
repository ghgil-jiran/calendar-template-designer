(() => {
    'use strict';

    function generateThemeCopy(title, description, imageCounts, referenceMonths) {
        const monthlyDirection = [
            '새해의 시작과 첫인상', '겨울의 끝과 다음 계절의 기대', '봄의 시작과 새로운 일상',
            '봄의 변화와 발견', '초록이 짙어지는 계절', '상반기를 돌아보는 여유',
            '한여름의 활기', '여름의 쉼과 여운', '가을의 시작과 새로운 리듬',
            '가을의 깊이와 수확', '한 해를 돌아보는 기록', '한 해의 마무리와 다음 해의 기대'
        ];
        const theme = [title, description].filter(Boolean).join(' — ');
        const months = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1, title: (i + 1) + '월',
            theme_text: /THE YEAR IN OBJECTS/i.test(title) ? referenceMonths[i].memo_title : monthlyDirection[i], concept_text: title + ' · ' + monthlyDirection[i],
            accent: ['#45645A','#7D4F62','#355E80','#805C30'][Math.floor(i / 3)],
            photo_slots: imageCounts[i], memo_title: '메모', prompt_subject: theme + ' · ' + (i + 1) + '월 · ' + monthlyDirection[i]
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

    window.ACDLDesignerThemeCopy = Object.freeze({generateThemeCopy, habitMonths, applyHabitCopy});
})();
