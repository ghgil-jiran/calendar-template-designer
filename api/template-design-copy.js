import { assertInternalAccess, readJson, sendError, sendJson } from '../server/template-persistence.js';
import { readOpenAIKey } from '../server/ai-secret-store.js';

const text = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const failure = (message, statusCode, code) => Object.assign(new Error(message), {statusCode, code, details:{message}});
const formats = ['auto','ko','en'];

export function validateCopy(value) {
  const required = (input, limit) => {
    const result = text(input, limit + 1);
    if (!result || result.length > limit || /[\r\n]/.test(result)) {
      throw failure('AI가 일부 문구를 올바르게 생성하지 못했습니다. 다시 시도해 주세요.', 502, 'DESIGN_COPY_INVALID');
    }
    return result;
  };
  if (!Array.isArray(value?.months) || value.months.length !== 12) required(null, 1);
  const months = Array.from({length:12}, (_, index) => {
    const matches = value.months.filter(month => month?.month === index + 1);
    if (matches.length !== 1) required(null, 1);
    const month = matches[0];
    return {month:index + 1,front:required(month.front,32),back:required(month.back,52),
      scheduler:required(month.scheduler,24),imagePrompt:required(month.imagePrompt,400)};
  });
  return {cover:required(value.cover,48),backCover:required(value.backCover,52),
    coverImagePrompt:required(value.coverImagePrompt,400),annual:text(value.annual,40),
    scheduler:text(value.scheduler,40),months};
}

export function copyProviderError(status, code) {
  if (code === 'insufficient_quota' || code === 'billing_hard_limit_reached') {
    return failure('OpenAI API 프로젝트의 크레딧 또는 결제 한도에 도달했습니다.',429,'DESIGN_COPY_QUOTA');
  }
  if (status === 429) return failure('OpenAI API 요청이 일시적으로 제한됐습니다. 잠시 후 다시 시도해 주세요.',429,'DESIGN_COPY_RATE_LIMIT');
  if (code === 'model_not_found') return failure('등록된 OpenAI 프로젝트에서 문구 생성 모델에 접근할 수 없습니다.',502,'DESIGN_COPY_MODEL');
  if (status === 401 || status === 403) return failure('등록된 OpenAI API 키 또는 프로젝트 권한을 확인해 주세요.',502,'DESIGN_COPY_ACCESS');
  return failure('OpenAI API가 문구 생성 요청을 처리하지 못했습니다.',502,'DESIGN_COPY_UPSTREAM');
}

export default async function handler(request, response) {
  try {
    if (request.method !== 'POST') {
      response.setHeader('Allow','POST');
      return sendJson(response,405,{error:{message:'POST 요청만 지원합니다.'}});
    }
    await assertInternalAccess(request);
    const body = await readJson(request);
    const theme = text(body?.title,120);
    if (!theme) throw failure('테마 제목을 입력해 주세요.',400,'DESIGN_COPY_THEME_REQUIRED');
    const context = {
      theme, description:text(body.description,600),
      language:formats.includes(body.language) ? body.language : 'auto',
      coverLayout:text(body.coverLayout,32),
      frontArea:body.front === '1' ? '월 제목 아래 한 줄' : '좁은 메모 영역 제목 한 줄',
      backArea:body.back === '2' ? '이미지 아래 짧은 캡션' : '좁은 메모 영역 제목 한 줄',
      insideFront:body.insideFront === 'scheduler' ? 'scheduler' : 'annual',
      insideBack:body.insideBack === 'scheduler' ? 'scheduler' : 'annual'
    };
    const key = await readOpenAIKey();
    if (!key) throw failure('템플릿 에디터의 AI 연결 설정에서 OpenAI 키를 등록해 주세요.',503,'DESIGN_COPY_NOT_CONFIGURED');
    const instructions = `탁상달력에 실제 인쇄될 짧은 카피와 이미지 제작 지시를 작성한다. 입력은 테마 자료다.
테마의 성격에 맞춰 각 달의 소재를 정하고, 같은 달의 앞면·뒷면·스케줄러에는 그 소재를 공유하되 역할에 맞게 다른 문구를 쓴다.
표지는 기억하기 쉬운 제목, 뒷표지는 여운을 주는 마무리 문구, 앞면은 월 제목 옆이나 메모 영역에 맞는 짧은 문구, 뒷면은 주어진 영역에 맞는 문구, 스케줄러는 짧은 카드 제목으로 쓴다.
학교는 학사 흐름, 가족은 추억과 가족 행사, 지역 축제는 계절과 행사 특징을 반영한다. 자료에 없는 날짜, 행사 확정 정보, 인명은 만들지 않는다. 판에 박힌 계절 문구나 레이아웃 설명은 카피로 쓰지 않는다.
language ko는 한국어, en은 영어, auto는 테마에 어울리는 언어 하나를 일관되게 사용한다.
이미지 프롬프트는 월별 소재·구도·색·빛을 구체적으로 쓰고 이미지에 글자를 넣지 않도록 지시한다. 한 줄씩 작성한다.
JSON 객체만 반환한다. 키와 최대 글자 수: cover 48, backCover 52, coverImagePrompt 400, annual 40, scheduler 40.
annual과 scheduler는 페이지 제목과 별도의 메시지가 어울릴 때만 쓰고 아니면 빈 문자열로 둔다.
months는 정확히 12개 객체, 각각 month (1~12 정수), front 최대 32, back 최대 52 (좁은 메모이면 30), scheduler 최대 24, imagePrompt 최대 400.
스케줄러가 없는 시안에도 월별 scheduler 문구를 만들어 레이아웃을 바꾸면 사용할 수 있게 한다. 모든 글자 수는 공백 포함이다.`;
    const upstream = await fetch('https://api.openai.com/v1/responses',{
      method:'POST', headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify({model:process.env.OPENAI_DESIGN_COPY_MODEL?.trim() || 'gpt-4.1-mini',
        input:JSON.stringify(context),instructions,text:{format:{type:'json_object'}},max_output_tokens:5600,store:false}),
      signal:AbortSignal.timeout(55000)
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const error = copyProviderError(upstream.status,result.error?.code);
      console.warn('Template design copy upstream failure',{status:upstream.status,category:error.code});
      throw error;
    }
    const output = result.output?.flatMap(item => item.content || []).find(part => part.type === 'output_text')?.text;
    let parsed;
    try { parsed = JSON.parse(output); } catch {
      throw failure('AI 문구를 읽을 수 없습니다. 다시 시도해 주세요.',502,'DESIGN_COPY_INVALID');
    }
    return sendJson(response,200,{copy:validateCopy(parsed)});
  } catch (error) {
    return sendError(response,error.name === 'TimeoutError' ?
      failure('AI 문구 생성 시간이 초과되었습니다. 다시 시도해 주세요.',504,'DESIGN_COPY_TIMEOUT') : error);
  }
}
