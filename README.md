# 24주 마라톤 플래너

초보자(주 10km)를 위한 6개월(24주) 풀코스 마라톤 훈련 웹 앱입니다.

## 기능

- ✅ **24주 훈련 계획 자동 생성**: 주차별 거리, 페이스, 휴식일 자동 계산
- ✅ **일일 훈련 기록**: 거리, 시간 입력으로 페이스 자동 계산
- ✅ **진행률 시각화**: 주간 계획 vs 실적 차트, 롱런 추이 그래프
- ✅ **목표 대비 현재 상태**: 누적 거리, 달성률, 다음 훈련 안내
- ✅ **Google 로그인**: Firebase Authentication으로 안전한 로그인
- ✅ **클라우드 저장**: Firestore로 모든 기기에서 데이터 동기화
- ✅ **모바일 반응형**: 모바일에서도 편리하게 사용 가능

## 로컬 개발 환경 설정

### 1. 저장소 클론 및 의존성 설치

```bash
npm install
```

### 2. Firebase 프로젝트 생성 및 설정

1. [Firebase Console](https://console.firebase.google.com)에 접속
2. "프로젝트 추가" 클릭하여 새 프로젝트 생성
3. 프로젝트 설정 > 일반 > "앱 추가" > 웹 앱 선택
4. 앱 닉네임 입력 후 등록
5. Firebase SDK 설정에서 제공되는 설정 값 복사

### 3. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 Firebase 설정 값 입력:

```bash
cp .env.example .env
```

`.env` 파일을 열어 Firebase 설정 값 입력:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Firebase Authentication 설정

1. Firebase Console > Authentication > Sign-in method
2. "Google" 제공업체 활성화
3. 프로젝트 지원 이메일 설정 (필요시)

### 5. Firestore 데이터베이스 설정

1. Firebase Console > Firestore Database
2. "데이터베이스 만들기" 클릭
3. 프로덕션 모드 선택 (테스트 모드도 가능하지만 보안 규칙 설정 권장)
4. 위치 선택 (가장 가까운 리전 선택)

### 6. Firestore 보안 규칙 설정 (권장)

Firebase Console > Firestore Database > 규칙에서 다음 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userData/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

이 규칙은 사용자가 자신의 데이터만 읽고 쓸 수 있도록 보장합니다.

### 7. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## Vercel 배포

### 1. Vercel 계정 생성

[Vercel](https://vercel.com)에 가입하고 GitHub 계정 연결

### 2. 프로젝트 배포

1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 저장소 선택 또는 Git 저장소 URL 입력
3. 프로젝트 설정:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment Variables 섹션에서 Firebase 환경 변수 추가:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. "Deploy" 클릭

### 3. Firebase 인증 도메인 추가

배포 완료 후 Vercel에서 제공하는 도메인을 Firebase Console에 추가:

1. Firebase Console > Authentication > Settings > 승인된 도메인
2. "도메인 추가" 클릭
3. Vercel 도메인 입력 (예: `your-app.vercel.app`)

## 사용 방법

1. 웹 앱 접속 후 "Google로 로그인" 클릭
2. Google 계정으로 로그인
3. 설정에서 훈련 시작일과 현재 주간 거리 입력
4. 매일 훈련 후 기록 입력
5. 진행률 탭에서 차트 확인

## 기술 스택

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Charts**: Recharts
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **Deployment**: Vercel
- **Date Utilities**: date-fns

## 라이선스

MIT
