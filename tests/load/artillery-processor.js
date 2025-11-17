/**
 * Artillery processor for custom load testing logic
 */

module.exports = {
    // Generate random timestamp
    generateTimestamp: function (context, events, done) {
        context.vars.timestamp = Date.now();
        return done();
    },

    // Generate random room ID
    generateRoomId: function (context, events, done) {
        const roomId = `load-test-room-${Math.floor(Math.random() * 50)}`;
        context.vars.roomId = roomId;
        return done();
    },

    // Generate random user
    generateUser: function (context, events, done) {
        const userId = `user-${Math.floor(Math.random() * 10000)}`;
        const username = `LoadTestUser${Math.floor(Math.random() * 10000)}`;
        context.vars.userId = userId;
        context.vars.username = username;
        return done();
    },

    // Log response for debugging
    logResponse: function (requestParams, response, context, ee, next) {
        if (response.statusCode !== 200) {
            console.error(`Error response: ${response.statusCode}`);
            console.error(`Body: ${JSON.stringify(response.body)}`);
        }
        return next();
    },

    // Custom metrics
    recordCustomMetrics: function (requestParams, response, context, ee, next) {
        // Emit custom metrics
        if (response.body && response.body.executionTime) {
            ee.emit('customStat', {
                stat: 'code_execution_time',
                value: response.body.executionTime
            });
        }
        return next();
    },

    // Before scenario hook
    beforeScenario: function (context, ee, next) {
        // Initialize context variables
        context.vars.startTime = Date.now();
        return next();
    },

    // After scenario hook
    afterScenario: function (context, ee, next) {
        // Calculate total scenario duration
        const duration = Date.now() - context.vars.startTime;
        ee.emit('customStat', {
            stat: 'scenario_duration',
            value: duration
        });
        return next();
    },

    // WebSocket connection handler
    setupWebSocket: function (context, events, done) {
        context.vars.wsConnected = true;
        return done();
    },

    // Simulate realistic typing delays
    generateTypingDelay: function (context, events, done) {
        // Random delay between 50-200ms to simulate human typing
        const delay = Math.floor(Math.random() * 150) + 50;
        context.vars.typingDelay = delay;
        return done();
    },

    // Generate code snippets for testing
    generateCodeSnippet: function (context, events, done) {
        const snippets = [
            'console.log("Hello, World!");',
            'function test() { return 42; }',
            'const x = [1, 2, 3, 4, 5];',
            'for (let i = 0; i < 10; i++) { console.log(i); }',
            'class Example { constructor() { this.value = 0; } }',
            'async function fetchData() { return await Promise.resolve("data"); }',
            'const sum = (a, b) => a + b;',
            'try { JSON.parse("test"); } catch(e) { console.error(e); }'
        ];
        const snippet = snippets[Math.floor(Math.random() * snippets.length)];
        context.vars.codeSnippet = snippet;
        return done();
    },

    // Validate room response
    validateRoomResponse: function (requestParams, response, context, ee, next) {
        if (response.body) {
            const body = typeof response.body === 'string'
                ? JSON.parse(response.body)
                : response.body;

            if (body.roomId) {
                context.vars.validatedRoomId = body.roomId;
                ee.emit('customStat', {
                    stat: 'valid_room_created',
                    value: 1
                });
            } else {
                ee.emit('customStat', {
                    stat: 'invalid_room_response',
                    value: 1
                });
            }
        }
        return next();
    },

    // Error handler
    onError: function (error, context, ee, next) {
        console.error('Load test error:', error);
        ee.emit('customStat', {
            stat: 'test_errors',
            value: 1
        });
        return next();
    }
};
