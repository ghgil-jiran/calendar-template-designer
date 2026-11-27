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

    window.ACDLDesignerThemeCopy = Object.freeze({generateThemeCopy});
})();
