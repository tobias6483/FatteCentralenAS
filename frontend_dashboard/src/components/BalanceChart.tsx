"use client";

import React, { useRef, useState } from 'react'; // Import useRef and useState
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Import Filler for area fills
  TimeScale, // Import TimeScale for time-based x-axis
  ChartOptions,
  ChartData,
  Chart // Import Chart type for ref
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import the date adapter
import zoomPlugin from 'chartjs-plugin-zoom'; // Import the zoom plugin

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  zoomPlugin // Register the zoom plugin
);

interface BalanceChartProps {
  chartData: {
    labels: string[]; // Expecting ISO date strings or parsable date strings
    data: number[];
  };
  isLoading?: boolean;
  error?: string | null;
  onRangeChange?: (range: string) => void; // Callback for time range changes
}

const timeRanges = [
  { label: '7D', value: '7D' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Å', value: '1Y' }, // 1Å for 1 Year
  { label: '3Å', value: '3Y' }, // 3Å for 3 Years
  { label: 'Altid', value: 'ALL' }, // Altid for All Time
];

const BalanceChart: React.FC<BalanceChartProps> = ({ chartData, isLoading, error, onRangeChange }) => {
  const chartRef = useRef<ChartJS<'line', number[], string>>(null); // Ref for the chart instance
  const [selectedRange, setSelectedRange] = useState<string>('7D'); // Default to 7 days or initial prop

  const handleZoomIn = () => {
    chartRef.current?.zoom(1.1);
  };

  const handleZoomOut = () => {
    chartRef.current?.zoom(0.9);
  };

  const handleResetZoom = () => {
    chartRef.current?.resetZoom();
  };

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    if (onRangeChange) {
      onRangeChange(range);
    }
    // Note: Actual data fetching/filtering based on range would happen in the parent component
    // and new chartData would be passed down.
    // For now, we just update the selected state and call the callback.
    // If data is static and large, we might filter it here, but typically it's fetched.
    // Reset zoom when range changes to avoid confusion
    handleResetZoom();
  };

  if (isLoading) {
    return <div className="text-center text-[var(--text-secondary)] py-8">Indlæser graf...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">Fejl ved indlæsning af graf: {error}</div>;
  }

  if (!chartData || chartData.labels.length === 0 || chartData.data.length === 0) {
    return <div className="text-center text-[var(--text-secondary)] py-8">Ingen data tilgængelig for grafen.</div>;
  }

  // Assuming --primary-accent is 'rgb(59, 130, 246)' (Tailwind blue-500)
  // Assuming --card-background is 'rgb(45, 55, 72)' (Tailwind gray-800)
  // Assuming --background is 'rgb(26, 32, 44)' (Tailwind gray-900)
  // Assuming --foreground is 'rgb(226, 232, 240)' (Tailwind gray-200)
  // Assuming --text-secondary is 'rgb(160, 174, 192)' (Tailwind gray-400)

  const primaryAccentHex = '#3B82F6'; // Tailwind blue-500
  const primaryAccentRgbParts = '59, 130, 246'; // RGB for #3B82F6

  const cardBackgroundRgb = '45, 55, 72'; // For 'gray-800', from var(--card-background)
  const backgroundRgb = '26, 32, 44'; // For 'gray-900', from var(--background)
  const textSecondaryRgb = '160, 174, 192'; // For 'gray-400', from var(--text-secondary)
  const foregroundRgb = '226, 232, 240'; // For 'gray-200', from var(--foreground)


  const data: ChartData<'line'> = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Saldo',
        data: chartData.data,
        fill: true,
        backgroundColor: `rgba(${primaryAccentRgbParts}, 0.25)`, // Use the blue accent
        borderColor: primaryAccentHex, // Use the blue accent
        tension: 0.1,
        pointBackgroundColor: primaryAccentHex, // Use the blue accent
        pointBorderColor: `rgb(${cardBackgroundRgb})`, // Contrast with card background
        pointHoverBackgroundColor: `rgb(${cardBackgroundRgb})`,
        pointHoverBorderColor: primaryAccentHex, // Use the blue accent
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'dd MMM yyyy',
          displayFormats: {
            day: 'dd MMM'
          }
        },
        title: {
          display: false,
          text: 'Dato',
          color: `rgb(${textSecondaryRgb})`
        },
        ticks: {
          color: `rgb(${textSecondaryRgb})`,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7
        },
        grid: {
          color: `rgba(${textSecondaryRgb}, 0.15)`, // More subtle grid lines
        }
      },
      y: {
        min: 0, // Set Y-axis minimum to 0
        max: 10000000, // Set Y-axis maximum to 10,000,000
        // beginAtZero: false, // This is overridden by min: 0
        title: {
          display: false,
          text: 'Saldo (kr.)',
          color: `rgb(${textSecondaryRgb})`
        },
        ticks: {
          color: `rgb(${textSecondaryRgb})`,
          callback: function(value) {
            if (typeof value === 'number') {
              return value.toLocaleString('da-DK') + ' kr.';
            }
            return value;
          }
        },
        grid: {
          color: `rgba(${textSecondaryRgb}, 0.15)`, // More subtle grid lines
        }
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: `rgba(${backgroundRgb}, 0.85)`, // Use main background for tooltip
        titleColor: `rgb(${foregroundRgb})`,
        bodyColor: `rgb(${textSecondaryRgb})`,
        padding: 10, // Add some padding to tooltip
        cornerRadius: 4, // Rounded corners for tooltip
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' });
            }
            return label;
          }
        }
      },
      zoom: { // Zoom plugin configuration
        zoom: {
          wheel: {
            enabled: false, // Disable mouse wheel zoom
          },
          pinch: {
            enabled: true
          },
          mode: 'xy', // Allow zooming on both x and y axes
        },
        pan: {
          enabled: true,
          mode: 'xy', // Allow panning on both x and y axes
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
  };

  return (
    <div>
      <div style={{ height: '300px' }}> {/* Or use Tailwind height classes e.g., h-72 */}
        <Line ref={chartRef} options={options} data={data} />
      </div>
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3">
        {/* Time Range Selector */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-2">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => handleRangeChange(range.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                ${selectedRange === range.value
                  ? 'bg-[var(--primary-accent)] text-white'
                  : 'bg-[var(--card-background-dark)] hover:bg-slate-700 text-[var(--text-secondary)]'
                }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomIn}
            className="px-3 py-1.5 text-xs font-medium bg-[var(--card-background-dark)] hover:bg-slate-700 text-[var(--text-secondary)] rounded-md transition-colors"
            title="Zoom Ind"
          >
            Zoom Ind
          </button>
          <button
            onClick={handleZoomOut}
            className="px-3 py-1.5 text-xs font-medium bg-[var(--card-background-dark)] hover:bg-slate-700 text-[var(--text-secondary)] rounded-md transition-colors"
            title="Zoom Ud"
          >
            Zoom Ud
          </button>
          <button
            onClick={handleResetZoom}
            className="px-3 py-1.5 text-xs font-medium bg-[var(--card-background-dark)] hover:bg-slate-700 text-[var(--text-secondary)] rounded-md transition-colors"
            title="Nulstil Zoom"
          >
            Nulstil
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceChart;