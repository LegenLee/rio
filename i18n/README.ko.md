# Rio (리오)

Material 3 Expressive의 Vue 구현체입니다.  
[Nozomi](https://github.com/LegenLee/nozomi) 프로젝트의 Vuetify
프레임워크를 대체하기 위해 작성하는 UI 라이브러리입니다.  
문서 페이지는 [여기](https://legenlee.github.io/rio/)를 확인해주시기 바랍니다.

## 목적

> 염병할 구글이 Material Web을 다 만들지도 않고 유지보수 모드로 전환했다! 아, 통탄스럽구나! 구글 특유의 라이브러리 유기가 또 나왔다! 꼴 받아서 도저히 못 참겠다! 내가 만든다!

네, 그렇습니다.

## 면책 조항

Material Design과 Material 3는 Google LLC의 상표입니다. 이 프로젝트는 Google과 아무 관계가 없고 Google이 보증하는 프로젝트도 아닙니다.

## 로드맵

현재 개발 중에 있는 프로젝트입니다. 1.0 출시 전까지는 마이너 버전이 올라갈 때마다 API가 깨질 수 있습니다.

### v0.1

- [x] 기반: 색(material-color-utilities 사용), 고도, 모션, 모양, 타이포그래피, 상태
- [x] 버튼
- [x] 아이콘 버튼
- [x] 스위치

### v0.2

- [x] 버튼 그룹
- [x] 분할 버튼
- [x] 예제가 있는 문서 사이트

### v0.3

- [x] 메뉴 (하위 메뉴 포함)
- [x] 툴팁
- [x] 다이얼로그

### v0.4

- [x] 체크박스와 라디오 버튼
- [x] 텍스트 필드

### v0.5

- [x] 링크 버튼
- [x] 셀렉트
- [x] 날짜 선택기
- [x] 시간 선택기

### v0.6 (폼 제어)

- [x] 스위치의 폼 값
- [x] 슬라이더
- [x] 스크롤 시간 선택기
- [x] 날짜 범위 선택기
- [x] 칩
- [ ] 리스트, 리스트 항목 (아마도?)
- [x] 로딩 진행 바
- [x] 로딩 표시 (Shape morph)
- [x] 스크롤 필드

### v0.6.1

- [ ] 아이콘
- [ ] 언어별 줄 높이와 가변 글꼴 축

### v0.7 (레이아웃)

- [ ] 앱 바
- [ ] FAB
- [ ] 네비게이션 서랍 + 레일 버튼
- [ ] 카드
- [ ] 시트
- [ ] 툴바
- [ ] 전체화면 다이얼로그 (날짜 선택기, 시간 선택기, 기타 등등)

## 사용법

```sh
pnpm add @rio-m3e/vue
```

`createRio`로 테마(페이지의 CSS 변수)와 Rio 컴포넌트의 언어를 정합니다.
앱을 **마운트하기 전**에 Vue 플러그인으로 등록합니다.

```ts
// main.ts
import { createRio } from '@rio-m3e/vue';
import { createApp } from 'vue';
import App from './App.vue';

const rio = createRio({
  theme: { sourceColor: '#6750a4' }, // 시스템 설정을 따라 라이트·다크 전환
  locale: 'ko', // 언어를 고정할 때 채움, 없으면 페이지의 <html lang>, 그다음 브라우저 언어
});

createApp(App).use(rio).mount('#app');
```

컴포넌트 스타일은 컴포넌트를 import하면 따라옵니다.
아이콘은 직접 추가해서 사용해야 합니다. 아래의 코드는 *Material Design Icons*를 사용하여 컴포넌트를 배치한 예시입니다.

```vue
<script setup lang="ts">
import { mdiHeart, mdiHeartOutline } from '@mdi/js';
import { RioButton, RioIconButton, RioSwitch } from '@rio-m3e/vue';
import { ref } from 'vue';

const favorite = ref(false);
const wifi = ref(true);
</script>

<template>
  <RioButton variant="tonal">저장</RioButton>

  <RioIconButton v-model:selected="favorite" label="즐겨찾기에 추가" toggle variant="standard">
    <svg viewBox="0 0 24 24"><path :d="mdiHeartOutline" fill="currentColor" /></svg>
    <template #selected-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiHeart" fill="currentColor" /></svg>
    </template>
  </RioIconButton>

  <label><RioSwitch v-model:selected="wifi" /> Wi-Fi</label>
</template>
```

컴포넌트별 설명은 [docs/components](/docs/components)에 정리되어 있습니다(영어).

## 개발

### 개발 환경 세팅

[Node.js](https://nodejs.org) v24 이상에서 구동 및 빌드가 가능하며 에디터로 [Visual Studio Code](https://code.visualstudio.com/)를 권장합니다.  
패키지 매니저는 pnpm 11을 사용합니다.

### Visual Studio Code 필수 확장 프로그램

- [Vue](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [Oxc](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode) (포매터와 린터)

### 명령어

```sh
pnpm install
pnpm exec playwright install chromium   # 처음 한 번만 실행
pnpm dev                                # playground
pnpm test --run
```

작업 브랜치는 `dev`이고, PR도 `dev`로 받고 있습니다. 규칙은 [docs/conventions.md](/docs/conventions.md)에, M3E를 어떻게 읽고 옮겼는지는 [docs/foundations.md](/docs/foundations.md)에 있습니다. 해당 문서는 영어로 작성합니다.

## Material Color Utilities 관련

> **새끼… 기열!!**  
> 아, 이 무슨 경우란 말인가! 감히 확장자도 달지 않은 채 자진입대를 감행한 기열 오도九글 때문에 노오도 해병이 악기바리를 거부하는 찐빠가 벌어지고야 말았다([#195](https://github.com/material-foundation/material-color-utilities/issues/195))!  
> "악!! 혹시 해병스크립트(싸제 말로 자바스크립트) 확장자를 붙여서 자진입대 하시려던 것인지 여쭤봐도 되는 의중을 확인하는 것에 허락을 구하는 것을 고려해도 되겠습니까?!?!"  
> 지금부터 이 새끼의 라이브러리에 장난(싸제 말로 번들링)을 실시한다!!  
> **악!!**

네, 그렇습니다.

## 왜 이름이 (츠카츠키) 리오인가요

> 내 마음이다! 내가 내 프로젝트에 리오라고 붙이는 게 뭐가 불만이냐! 꼴 받으면 내 프로젝트 포크해서 이름 바꿔서 내도 된다!

네, 그렇습니다.

## 라이선스

    Copyright © 2026 LegenLee

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

`@rio-m3e/tokens`에는 Google LLC의 [material-color-utilities](https://github.com/material-foundation/material-color-utilities)(Apache License 2.0)가 번들되어 있습니다. [NOTICE](/NOTICE)를 참고해주시기 바랍니다.

## README 번역

- [English](/README.md)
- [Korean / 한국어](/i18n/README.ko.md)
