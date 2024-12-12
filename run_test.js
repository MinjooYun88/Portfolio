import { Worker } from 'worker_threads';
import fs from 'fs/promises';
import { reportToJira } from './jira_integration.js';
import { saveTestResultsToDatabase } from './db_handler.js'; // DB 핸들러 모듈 가져오기

const countries = JSON.parse(await fs.readFile('./countries.json', 'utf8'));
const MAX_WORKERS = 2; // 최대 워커 수

// Worker 실행 함수
function runWorker(country, config) {
    return new Promise((resolve) => {
        const worker = new Worker('./worker_test.js', { workerData: { country, config } });

        console.log(`Starting worker for ${country}...`); // 워커 시작 로그

        // 메시지가 오면 결과를 resolve
        worker.on('message', (result) => {
            console.log(`Worker finished for ${country}:`, result.status);
            resolve(result);
        });

        // 에러가 발생하면 실패한 상태로 처리
        worker.on('error', (err) => {
            console.error(`Error in worker for ${country}:`, err.message);
            resolve({
                country,
                status: 'failed',
                error: err.message,
                total: 0,
                passed: 0,
                failed: 0,
                details: [],
            });
        });
    });
}

async function runAllTests() {
    const results = [];
    const workerQueue = [];
    const countryEntries = Object.entries(countries);

    // 모든 국가에 대해 워커 실행
    for (const [country, config] of countryEntries) {
        console.log(`Starting tests for ${country}...`);
        workerQueue.push(runWorker(country, config));

        // 워커가 최대 수에 도달하면 완료된 워커를 기다림
        if (workerQueue.length >= MAX_WORKERS) {
            const finishedWorkers = await Promise.allSettled(workerQueue);
            finishedWorkers.forEach((worker) => {
                if (worker.status === 'fulfilled') {
                    results.push(worker.value);
                } else {
                    console.error(`Worker failed:`, worker.reason);
                }
            });
            workerQueue.length = 0; // 워커 큐 비우기
        }
    }

    // 남아 있는 워커 처리
    const remainingWorkers = await Promise.allSettled(workerQueue);
    remainingWorkers.forEach((worker) => {
        if (worker.status === 'fulfilled') {
            results.push(worker.value);
        } else {
            console.error(`Worker failed:`, worker.reason);
        }
    });

    // 결과를 저장
    const testResultsPath = './test_results.json';
    await fs.writeFile(testResultsPath, JSON.stringify(results, null, 2));
    console.log(`Test results saved to ${testResultsPath}`);

    // DB 저장 호출
    try {
        await saveTestResultsToDatabase(results);
    } catch (dbError) {
        console.error('Failed to save test results to the database:', dbError.message);
    }

    // 실패한 테스트 케이스만 Jira에 연동
    const failedResults = results.filter((result) => result.failed > 0);
    if (failedResults.length > 0) {
        console.log('Integrating failed tests with Jira...');
        try {
            await reportToJira(failedResults);
        } catch (jiraError) {
            console.error('Failed to integrate failed tests with Jira:', jiraError.message);
        }
    } else {
        console.log('No failed tests to integrate with Jira.');
    }
}

// 실행
(async () => {
    try {
        console.log('Starting tests...');
        await runAllTests();
    } catch (error) {
        console.error('Error in test execution:', error.message);
    }
})();