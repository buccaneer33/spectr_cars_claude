# CORS headers
add_header Access-Control-Allow-Origin $http_origin always;
add_header Access-Control-Allow-Credentials true always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;

# Preflight requests
if ($request_method = OPTIONS) {
    add_header Access-Control-Allow-Origin $http_origin;
    add_header Access-Control-Allow-Credentials true;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH";
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
    add_header Access-Control-Max-Age 86400;
    add_header Content-Length 0;
    add_header Content-Type text/plain;
    return 204;
}
