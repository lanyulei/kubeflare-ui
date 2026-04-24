import { theme } from 'antd';
import { useMemo } from 'react';
import type { RadarDataItem } from '../types';
import useStyles from '../style.style';

type RadarChartProps = {
  data: RadarDataItem[];
};

const COLORS = ['#1677ff', '#36cfc9', '#faad14'];

const RadarChart = ({ data }: RadarChartProps) => {
  const { token } = theme.useToken();
  const { styles } = useStyles();

  const chart = useMemo(() => {
    const labels = Array.from(new Set(data.map((item) => item.label)));
    const seriesNames = Array.from(new Set(data.map((item) => item.name)));
    const maxValue = Math.max(...data.map((item) => item.value), 1);
    const size = 280;
    const center = size / 2;
    const radius = 96;
    const levels = 5;

    const angleForIndex = (index: number) =>
      -Math.PI / 2 + (Math.PI * 2 * index) / labels.length;

    const pointFor = (index: number, valueRatio: number) => {
      const angle = angleForIndex(index);
      return {
        x: center + Math.cos(angle) * radius * valueRatio,
        y: center + Math.sin(angle) * radius * valueRatio,
      };
    };

    const grids = Array.from({ length: levels }, (_, levelIndex) => {
      const ratio = (levelIndex + 1) / levels;
      return labels
        .map((_, labelIndex) => {
          const point = pointFor(labelIndex, ratio);
          return `${point.x},${point.y}`;
        })
        .join(' ');
    });

    const axes = labels.map((label, index) => {
      const outerPoint = pointFor(index, 1);
      const labelPoint = pointFor(index, 1.18);
      return {
        label,
        outerPoint,
        labelPoint,
        textAnchor:
          Math.abs(labelPoint.x - center) < 12
            ? 'middle'
            : labelPoint.x > center
              ? 'start'
              : 'end' as 'start' | 'middle' | 'end',
      };
    });

    const polygons = seriesNames.map((seriesName, seriesIndex) => {
      const points = labels
        .map((label, labelIndex) => {
          const target = data.find(
            (item) => item.name === seriesName && item.label === label,
          );
          const point = pointFor(labelIndex, (target?.value ?? 0) / maxValue);
          return `${point.x},${point.y}`;
        })
        .join(' ');

      return {
        color: COLORS[seriesIndex % COLORS.length],
        name: seriesName,
        points,
      };
    });

    return {
      axes,
      grids,
      polygons,
      size,
    };
  }, [data]);

  return (
    <div className={styles.radarChart}>
      <svg
        className={styles.radarSvg}
        height={chart.size}
        viewBox={`0 0 ${chart.size} ${chart.size}`}
        width={chart.size}
      >
        {chart.grids.map((points) => (
          <polygon className={styles.radarGrid} key={points} points={points} />
        ))}
        {chart.axes.map((axis) => (
          <g key={axis.label}>
            <line
              className={styles.radarAxis}
              x1={chart.size / 2}
              x2={axis.outerPoint.x}
              y1={chart.size / 2}
              y2={axis.outerPoint.y}
            />
            <text
              className={styles.radarAxisLabel}
              textAnchor={axis.textAnchor}
              x={axis.labelPoint.x}
              y={axis.labelPoint.y}
            >
              {axis.label}
            </text>
          </g>
        ))}
        {chart.polygons.map((polygon) => (
          <g key={polygon.name}>
            <polygon
              fill={polygon.color}
              fillOpacity={0.16}
              points={polygon.points}
              stroke={polygon.color}
              strokeWidth={2}
            />
            {polygon.points.split(' ').map((point) => {
              const [x, y] = point.split(',');
              return (
                <circle
                  cx={Number(x)}
                  cy={Number(y)}
                  fill={polygon.color}
                  key={`${polygon.name}-${point}`}
                  r={3}
                  stroke={token.colorBgContainer}
                  strokeWidth={1.5}
                />
              );
            })}
          </g>
        ))}
      </svg>
      <div className={styles.radarLegend}>
        {chart.polygons.map((polygon) => (
          <span className={styles.radarLegendItem} key={polygon.name}>
            <span
              className={styles.radarLegendSwatch}
              style={{ backgroundColor: polygon.color }}
            />
            {polygon.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RadarChart;
