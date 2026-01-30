
async function testOtp() {
    console.log('Testing OTP Endpoint...');
    try {
        const response = await fetch('http://localhost:3000/api/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '+60123456789' }) // Test number
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testOtp();
