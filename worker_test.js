import { parentPort, workerData } from 'worker_threads';
import Mocha from 'mocha';
import { runCommonHomeTest } from './test_scripts/common_home_test.js';

const { config } = workerData;

(async () => {
    try {
        const mocha = new Mocha();

        // Mocha 환경 설정
        mocha.suite.emit('pre-require', global, null, mocha);

        // 테스트 실행
        const testResults = await runCommonHomeTest(config);

        mocha.run(() => {
            parentPort.postMessage({
                country: config.currency,
                status: testResults.failed > 0 ? 'failed' : 'passed',
                total: testResults.total,
                passed: testResults.passed,
                failed: testResults.failed,
                details: testResults.details,
            });
        });
    } catch (error) {
        parentPort.postMessage({
            country: config.currency,
            status: 'failed',
            error: error.message,
            total: 0,
            passed: 0,
            failed: 0,
            details: [],
        });
    }
})();
