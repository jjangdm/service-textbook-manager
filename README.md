# 교재 미납/납부 조회 시스템

이 프로젝트는 학생들의 교재 구매 미납금액과 납부 내역을 조회할 수 있는 웹 서비스입니다.

## 주요 기능

1. **학생 조회**: 학생 이름과 고유번호로 학생 정보 검색
2. **미납 현황**: 미납된 교재 목록과 총 미납 금액 표시
3. **납부 내역**: 이미 납부한 교재 목록과 수납일 표시
4. **계좌 안내**: 납부 계좌 정보 제공
5. **관리자 기능**:
   - 새로운 학생 추가
   - 학생별 상세 교재 목록 조회
   - 새로운 교재 추가 (자동완성 및 가격 자동 입력)
   - 실시간 데이터 업데이트

## 프로젝트 구조

```
service_textbook_manager/
├── backend/           # Express.js 백엔드 서버
│   ├── config/        # 데이터베이스 설정
│   ├── models/        # Sequelize 모델 (Student, Book)
│   ├── server.js      # 메인 서버 파일
│   └── import_data.js # 데이터 임포트 스크립트
├── frontend/          # React 프론트엔드
│   ├── src/
│   │   ├── App.js     # 메인 컴포넌트
│   │   └── App.css    # 스타일링
│   └── public/
├── extract_data.py    # SQLite 데이터 추출 스크립트
├── extracted_data.json # 추출된 JSON 데이터
└── start_servers.bat  # 서버 시작 스크립트
```

## 설치 및 실행

### 1. 데이터 추출
기존 SQLite 데이터베이스에서 데이터를 추출합니다:
```bash
python extract_data.py
```

### 2. 백엔드 설정
```bash
cd backend
npm install
node import_data.js  # 데이터베이스 생성 및 데이터 임포트
```

### 3. 프론트엔드 설정
```bash
cd frontend
npm install
```

### 4. 서버 실행
두 가지 방법 중 선택:

**방법 1: 자동 실행 스크립트**
```bash
start_servers.bat
```

**방법 2: 수동 실행**
터미널 1 (백엔드):
```bash
cd backend
node server.js
```

터미널 2 (프론트엔드):
```bash
cd frontend
npm start
```

## 접속 정보

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000
- **관리자 페이지**: http://localhost:3000/secret-admin (비밀번호: admin123)

## API 엔드포인트

### 조회 API
- `GET /api/students` - 모든 학생 목록 조회 (디버깅용)
- `GET /api/student-info?student_code={코드}&name={이름}` - 특정 학생 정보 조회

### 관리 API
- `PUT /api/books/:id/payment` - 책 납부 상태 업데이트
- `POST /api/students/:studentCode/books` - 학생에게 새 책 추가
- `DELETE /api/books/:id` - 책 삭제

## 사용법

### 일반 사용자
1. 웹 브라우저에서 http://localhost:3000 접속
2. 학생의 고유 코드와 이름 입력
3. "조회" 버튼 클릭
4. 미납/납부 내역 확인

### 관리자
1. 웹 브라우저에서 http://localhost:3000/secret-admin 접속
2. 관리자 비밀번호 입력 (기본값: admin123)
3. **학생 관리**:
   - 이름 또는 코드로 학생 검색 및 선택
   - 새 학생 추가 (이름과 고유번호 입력)
4. **학생 정보 확인**: 선택된 학생의 미납/납부 교재 상세 목록 확인
5. **새 교재 추가**:
   - 도서명 입력 시 자동완성 기능 사용
   - 기존 교재 선택 시 최신 가격 자동 입력
   - 지급일은 오늘 날짜로 기본 설정
6. 모든 변경사항은 실시간으로 반영됩니다

## 기술 스택

- **Backend**: Node.js, Express.js, Sequelize, SQLite
- **Frontend**: React.js, CSS
- **Data**: Python (데이터 추출)

## 문제 해결

문제가 발생한 경우:

1. 두 서버가 모두 실행 중인지 확인
2. 포트 5000, 3000이 사용 가능한지 확인
3. `npm install`이 정상적으로 완료되었는지 확인
4. 데이터 임포트가 완료되었는지 확인

## 데이터베이스 스키마

### Students 테이블
- id: 자동 증가 ID
- name: 학생 이름
- student_code: 고유 학생 코드

### Books 테이블
- id: 자동 증가 ID
- input_date: 입력일
- book_name: 교재명
- price: 가격
- checking: 납부 여부 (boolean)
- payment_date: 수납일
- studentId: 학생 ID (외래키)
