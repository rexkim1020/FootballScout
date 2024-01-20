// server.js

const express = require('express');
const exceljs = require('exceljs');
const path = require('path');
const app = express();

// 엑셀 파일 경로
const excelFilePath = path.join(__dirname, 'public', 'fbref stats z-score.xlsx');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/main.html');
});

app.get('/next-page', (req, res) => {
    // 사용자 입력값 가져오기
    const min1 = Number(req.query.min1);
    const max1 = Number(req.query.max1);
    const min2 = Number(req.query.min2);
    const max2 = Number(req.query.max2);
    const weightGoal = Number(req.query.weightGoal) || 1;
    const weightAssist = Number(req.query.weightAssist) || 1;

    // 엑셀 파일을 불러오고 필터링하여 결과를 가져오는 함수 호출
    getFilteredPlayers(min1, max1, min2, max2)
        .then(filteredPlayers => {
            console.log('Sent filtered players:', filteredPlayers); // 콘솔에 전송된 데이터 확인

            // 결과를 클라이언트에 전송
            res.json(filteredPlayers);
        })
        .catch(error => {
            console.error('Error fetching filtered players:', error);
            res.status(500).send('Internal Server Error');
        });
});

function getFilteredPlayers(min1, max1, min2, max2) {
    const workbook = new exceljs.Workbook();

    return workbook.xlsx.readFile(excelFilePath)
        .then(() => {
            const worksheet = workbook.getWorksheet(1);
            const filteredPlayers = [];

            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                // 'Position'이 'RW'이고 'Fee'와 '90s'의 범위에 맞는 행을 필터링
                const position = row.getCell(14).value;
                const fee = Number(row.getCell(15).value);
                const minutes = Number(row.getCell(19).value);
                const goal = Number(row.getCell(3).value) || 0; // 'goal' 속성 추가
                const assist = Number(row.getCell(4).value) || 0; // 'assist' 속성 추가

                // 두 번째 열의 데이터를 문자열로 가져오도록 수정
                const playerNameCell = row.getCell(2);
                const playerName = playerNameCell.text;

                console.log('Position:', position, 'Fee:', fee, 'Minutes:', minutes, 'Goal:', goal, 'Assist:', assist, 'Player Name:', playerName);

                if (position === 'RW' && fee >= min1 && fee <= max1 && minutes >= min2 && minutes <= max2) {
                  filteredPlayers.push({
                      position: position,
                      fee: fee,
                      minutes: minutes,
                      goal: goal,
                      assist: assist,
                      name: playerName
                  });
                }
            });

            // 콘솔에 필터링된 선수 목록 출력
            console.log('Filtered Players:', JSON.stringify(filteredPlayers));

            return filteredPlayers;
        })
        .catch(err => {
            console.error(err);
            return [];
        });
}

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

app.get('/next-page.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'next-page.html'));
});
