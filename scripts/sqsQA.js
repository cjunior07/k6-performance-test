import exec from 'k6/execution'
import { check } from "k6";
import { AWSConfig, SQSClient } from 'https://jslib.k6.io/aws/0.7.2/sqs.js'
import { Rate } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export let errorRate = new Rate("errors");

export function handleSummary(data) {
  return {
    "./reports/html/result.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

// Credenciais AWS
const awsConfig = new AWSConfig({
  region: '',
  accessKeyId: '',
  secretAccessKey: '',
  sessionToken: '',
})

const sqs = new SQSClient(awsConfig)
const queueUri = ''

export const options = {
  scenarios: {
    sqsQA: {
      executor: "per-vu-iterations",
      vus: 2,
      iterations: 2,
    },
  },
};

export default function () {
  // Se a fila a ser testada não existe, aborta a execução.
  const queuesResponse = sqs.listQueues()
  if (queuesResponse.urls.filter((q) => q === queueUri).length == 0) {
    exec.test.abort()
  }

  // Enviando mensagem para fila SQS
  const payload = JSON.stringify({
    name: "Test_sqs_queue",
    test: 1,
  });
  const res = sqs.sendMessage(queueUri, payload);

  let checkRes = check(res, {
    "Includes id and bodyMD5": (res) => res.hasOwnProperty("id") && res.hasOwnProperty("bodyMD5"),
  });
  if (!checkRes) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
}