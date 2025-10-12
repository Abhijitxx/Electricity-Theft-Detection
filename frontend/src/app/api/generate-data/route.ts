import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { num_consumers, days, theft_rate } = body;

    // Validate inputs
    if (!num_consumers || num_consumers < 10 || num_consumers > 1000) {
      return NextResponse.json(
        { error: 'Number of consumers must be between 10 and 1000' },
        { status: 400 }
      );
    }

    if (!days || days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Number of days must be between 1 and 365' },
        { status: 400 }
      );
    }

    if (theft_rate < 0 || theft_rate > 0.5) {
      return NextResponse.json(
        { error: 'Theft rate must be between 0 and 0.5' },
        { status: 400 }
      );
    }

    // Forward request to Python backend
    const apiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/generate-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        num_consumers,
        days,
        theft_rate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Failed to generate data' },
        { status: response.status }
      );
    }

    // Get the CSV data
    const csvData = await response.text();

    // Return as downloadable CSV
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=synthetic_consumption_${num_consumers}consumers_${days}days.csv`,
      },
    });
  } catch (error) {
    console.error('Generate data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
