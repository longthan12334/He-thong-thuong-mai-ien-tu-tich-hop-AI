import contextlib
import http.client
import importlib.util
import io
from pathlib import Path
import unittest
from unittest.mock import Mock, patch


spec = importlib.util.spec_from_file_location(
    "compose_smoke", Path(__file__).with_name("check-compose-smoke.py")
)
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class SmokeCheckTests(unittest.TestCase):
    @patch.object(smoke.http.client, 'HTTPConnection')
    def test_response_contract(self, connect):
        examples = [
            (200, b'{"totalCount":7}', True, None),
            (200, b'{"totalCount":0}', True, 'expected a positive integer totalCount'),
            (200, b'{"totalCount":true}', True, 'expected a positive integer totalCount'),
            (200, b'{}', True, 'expected a positive integer totalCount'),
            (200, b'[]', True, 'expected a positive integer totalCount'),
            (200, b'<html/>', False, None),
            (302, b'', False, 'HTTP 302'),
            (503, b'', False, 'HTTP 503'),
        ]
        for status, body, require_products, expected in examples:
            with self.subTest(status=status, body=body):
                client = Mock()
                response = io.BytesIO(body)
                response.status = status
                client.getresponse.return_value = response
                connect.return_value = client
                actual = smoke.check(5000, '/test', require_products=require_products)
                self.assertEqual(actual, expected)
                client.close.assert_called_once()
        connect.assert_called_with('localhost', 5000, timeout=3)

    @patch.object(smoke.http.client, 'HTTPConnection')
    def test_malformed_json_and_connection_errors(self, connect):
        client = connect.return_value
        bad_json = io.BytesIO(b'{')
        bad_json.status = 200
        client.getresponse.side_effect = [bad_json, http.client.RemoteDisconnected()]
        self.assertIsInstance(smoke.check(5000, '/', require_products=True), str)
        self.assertEqual(smoke.check(5000, '/'), 'RemoteDisconnected')
        self.assertEqual(client.close.call_count, 2)

    @patch.object(smoke.time, 'sleep')
    @patch.object(smoke, 'check')
    def test_retry_until_ready_or_exhausted(self, check, sleep):
        scenarios = [(['HTTP 503', None], True, 2, 1), (['HTTP 503'] * 30, False, 30, 29)]
        for responses, ready, attempts, delays in scenarios:
            with self.subTest(ready=ready), contextlib.redirect_stdout(io.StringIO()):
                check.reset_mock()
                sleep.reset_mock()
                check.side_effect = responses
                self.assertEqual(smoke.wait_for('Frontend', 3001, '/'), ready)
                self.assertEqual(check.call_count, attempts)
                self.assertEqual(sleep.call_count, delays)


if __name__ == '__main__':
    unittest.main()
