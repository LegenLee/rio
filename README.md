# Rio (리오)

Material 3 Expressive의 Vue 구현체입니다.  
[Nozomi](https://github.com/LegenLee/nozomi) 프로젝트의 Vuetify
프레임워크를 대체하기 위해 작성하는 UI 라이브러리입니다.

## 목적

> 염병할 구글이 Material Web을 다 만들지도 않고 유지보수 모드로 전환했다! 아, 통탄스럽구나! 구글 특유의 라이브러리 유기가 또 나왔다! 꼴 받아서 도저히 못 참겠다! 내가 만든다!

네, 그렇습니다.

## 당장 쓸 수 있나요

초기 개발 단계이며, 첫 목표(v0.1)는 버튼, 아이콘 버튼, 스위치 컴포넌트입니다.

## 코드 작성 및 기여 관련

Node.js 24와 pnpm 11을 사용합니다. 작업 브랜치는 `dev`이고, PR도 `dev`로 받고 있습니다.

```sh
pnpm install
pnpm exec playwright install chromium   # 처음 한 번만
pnpm dev                                # playground
pnpm test --run
```

규칙은 [docs/conventions.md](docs/conventions.md)에, M3E를 어떻게 읽고 옮겼는지는 [docs/foundations.md](docs/foundations.md)에 있습니다. 해당 문서는 영어로 씁니다(Docs are in English).

## Material Color Utilities 관련

> 확장자 없는 import 때문에 node에서 실행이 바로 안 된다([#195](https://github.com/material-foundation/material-color-utilities/issues/195))... 지금부터 이 새끼의 라이브러리에 장난(싸제 말로 번들링)을 실시한다!

네, 그렇습니다.

## 왜 이름이 (츠카츠키) 리오인가요

> 내 마음이다! 내가 내 프로젝트에 리오라고 붙이는 게 뭐가 불만이냐! 꼴 받으면 내 프로젝트 포크해서 이름 바꿔서 내도 된다!

네, 그렇습니다.

## 라이선스

[Apache License 2.0](LICENSE)를 채택했습니다.

Copyright 2026 LegenLee

Material Design과 Material 3는 Google LLC의 상표입니다. 이 프로젝트는 Google과 아무 관계가 없고 Google이 보증하는 프로젝트도 아닙니다.
