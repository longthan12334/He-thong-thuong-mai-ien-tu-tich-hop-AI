"""Check that the Compose services are ready before CI tears them down."""

import argparse
import http.client
import json
import sys
import time


def check(port, path, *, require_products=False):
    connection = http.client.HTTPConnection("localhost", port, timeout=3)
    try:
        connection.request("GET", path)
        response = connection.getresponse()
        if response.status != 200:
            return f"HTTP {response.status}"
        if require_products:
            payload = json.load(response)
            total = payload.get("totalCount") if isinstance(payload, dict) else None
            if type(total) is not int or total <= 0:
                return "expected a positive integer totalCount"
        return None
    except (OSError, http.client.HTTPException, ValueError) as error:
        return str(error) or type(error).__name__
    finally:
        connection.close()


def wait_for(name, port, path, *, require_products=False):
    for attempt in range(1, 31):
        error = check(port, path, require_products=require_products)
        if error is None:
            print(f"{name} is ready", flush=True)
            return True
        print(f"{name} attempt {attempt}/30: {error}", flush=True)
        if attempt < 30:
            time.sleep(3)
    return False


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend-port', type=int, default=5000)
    parser.add_argument('--frontend-port', type=int, default=3001)
    args = parser.parse_args(argv)
    if not (1 <= args.backend_port <= 65535 and 1 <= args.frontend_port <= 65535):
        parser.error('ports must be between 1 and 65535')
    backend_ready = wait_for(
        'Backend', args.backend_port, '/api/products?pageSize=1', require_products=True
    )
    frontend_ready = backend_ready and wait_for('Frontend', args.frontend_port, '/')
    return 0 if frontend_ready else 1


if __name__ == '__main__':
    sys.exit(main())
