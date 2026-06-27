import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { FontFamilies } from "@/constants/typography";

interface BarChartProps {
  data: { label: string; value: number }[];
  currentIndex?: number;
  showValueLabelOnCurrent?: boolean;
}

export default function BarChart({ data, currentIndex = 0, showValueLabelOnCurrent = false }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 120;

  return (
    <View style={styles.container}>
      {data.map((item, idx) => {
        const barHeight = Math.max((item.value / maxValue) * chartHeight, 4);
        const isCurrentIdx = idx === currentIndex;
        const barColor = isCurrentIdx ? Colors.burgundy : Colors.gold;

        return (
          <View key={idx} style={styles.barColumn}>
            {showValueLabelOnCurrent && isCurrentIdx && (
              <Text style={styles.valueLabel}>{item.value}</Text>
            )}
            <View style={[styles.bar, { height: barHeight, backgroundColor: barColor }]}>
              <View style={[styles.highlight, { height: 3 }]} />
            </View>
            <Text style={styles.barLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: 4, justifyContent: "space-evenly", height: 160 },
  barColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 2 },
  bar: { width: "100%", borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  highlight: { backgroundColor: Colors.goldTint, width: "100%" },
  barLabel: { fontFamily: FontFamilies.hanken[700], fontSize: 9, fontWeight: "700", color: Colors.inkFaint },
  valueLabel: { fontFamily: FontFamilies.bricolage[800], fontSize: 14, fontWeight: "800", color: Colors.ink, marginBottom: 4 },
});
