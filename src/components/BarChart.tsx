import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
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
  const count = data.length;
  // Dynamic gap sizing based on the number of bars
  const barGap = count > 14 ? 3 : count > 7 ? 6 : 10;
  const totalGaps = barGap * (count + 1);
  const barWidth = Math.max(3, (width - totalGaps) / Math.max(count, 1));
  const goalY = height - ((goal ?? 0) / safePeak) * height;

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <Svg width={width} height={height + 22}>
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
              fontWeight="600"
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
          const centerX = x + barWidth / 2;

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={height - h}
                width={barWidth}
                height={Math.max(h, d.value > 0 ? 3 : 2)}
                rx={Math.min(radius.sm, barWidth / 2)}
                fill={isHighlight ? color : d.value > 0 ? colors.primarySoft : '#E5EEF9'}
              />
              {d.value > 0 && formatValue ? (
                <SvgText
                  x={centerX}
                  y={Math.max(12, height - h - 6)}
                  fill={isHighlight ? colors.primary : colors.textSecondary}
                  fontSize={10}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {formatValue(d.value)}
                </SvgText>
              ) : null}
              {d.label ? (
                <SvgText
                  x={centerX}
                  y={height + 16}
                  fill={isHighlight ? colors.primary : colors.textSecondary}
                  fontSize={count > 14 ? 9 : 11}
                  fontWeight={isHighlight ? '700' : '500'}
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
});