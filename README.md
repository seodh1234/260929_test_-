# 빵집 재고관리

HTML, CSS, JavaScript로 만든 GitHub Pages용 정적 재고관리 앱입니다.

배포 주소: <https://seodh1234.github.io/260929_test_-/>

## GitHub Pages 배포

1. 이 저장소의 `main` 브랜치에 변경사항을 push합니다.
2. GitHub 저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다.
3. **Actions** 탭에서 `Deploy static site to GitHub Pages` 작업이 완료되면 저장소의 Pages 주소로 접속합니다. 저장소 이름이 `260929_test_-`라면 주소는 `https://seodh1234.github.io/260929_test_-/` 형식입니다.

`.github/workflows/pages.yml`이 `main`에 push될 때 자동으로 배포합니다. 배포 URL은 GitHub 저장소의 **Settings → Pages**에서도 확인할 수 있습니다.

## 로그인 및 데이터

- 아이디: `admin`
- 비밀번호: `1234`
- 상품 데이터: 접속한 브라우저의 `localStorage`에 저장

상품 등록·수정·삭제, 검색, 안전재고 표시를 지원합니다. 데이터는 해당 브라우저에만 저장되어 다른 기기와 공유되지 않습니다. 로그인 정보도 JavaScript에 포함된 데모용이므로 민감한 데이터나 실제 서비스의 인증에 사용하지 마세요. 공용 PC에서는 로그아웃해 주세요.
