import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors, radius } from '../theme';

export interface BarDatum {
  value: number;
  label: string;
}

interface BarChartProps {
  data: BarDatum[];
  maxValue?: number;
  goal?: number;
  color?: string;
  highlightIndex?: number;
  height?: number;
  formatValue?: (value: number) => string;
}

export default function BarChart({
  data,
  maxValue,
  goal,
  color = colors.primary,
  highlightIndex = -1,
  height = 160,
  formatValue,
}: BarChartProps) {
  const [width, setWidth] = useState(320);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const peak = maxValue ?? Math.max(...data.map((d) => d.value), goal ?? 0, 1);
  const safePeak = peak <= 0 ? 1 : peak;
  const barGap = width > 300 ? 12 : 8;
  const barWidth = Math.max(
    4,
    (width - barGap * (data.length + 1)) / data.length,
  );
  const goalY = height - (goal ?? 0) / safePeak * height;

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <Svg width={width} height={height}>
        {goal !== undefined && goal > 0 && (
          <>
            <Line
              x1={0}
              y1={goalY}
              x2={width}
              y2={goalY}
              stroke={colors.warning}
              strokeWidth={1.5}
              strokeDasharray={[5, 4]}
            />
            <SvgText
              x={width - 4}
              y={goalY - 6}
              fill={colors.warning}
              fontSize={10}
              textAnchor="end"
            >
              goal
            </SvgText>
          </>
        )}
        {data.map((d, i) => {
          const h = (d.value / safePeak) * height;
          const x = barGap + i * (barWidth + barGap);
          const isHighlight = i === highlightIndex;
          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={height - h}
                width={barWidth}
                height={Math.max(h, d.value > 0 ? 2 : 0)}
                rx={radius.sm}
                fill={isHighlight ? color : colors.primarySoft}
              />
              {d.value > 0 && formatValue ? (
                <SvgText
                  x={x + barWidth / 2}
                  y={height - h - 6}
                  fill={isHighlight ? colors.primary : colors.textSecondary}
                  fontSize={10}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {formatValue(d.value)}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text
            key={i}
            style={[
              styles.label,
              i === highlightIndex && styles.labelHighlight,
              { width: barWidth },
            ]}
            numberOfLines={1}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
});