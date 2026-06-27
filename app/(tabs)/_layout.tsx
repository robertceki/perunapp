import React, { useState } from "react";
import { View } from "react-native";

import AlertBar from "@/components/AlertBar";
import DayFilter from "@/components/DayFilter";
import Header from "@/components/Header";
import { TrainingCard } from "@/components/TrainingCard";
import { useTrainings } from "@/hooks/useTrainings";

export default function TabsLayout() {
  const [selectedDay, setSelectedDay] = useState("monday");

  const { getTrainingsByDay } = useTrainings();

  const data = getTrainingsByDay(selectedDay);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* HEADER */}
      <Header />

      {/* TOP FILTER NAV */}
      <DayFilter selected={selectedDay} setSelected={setSelectedDay} />

      {/* ALERT BAR */}
      <AlertBar />

      {/* CONTENT */}
      <View
        style={{
          flex: 1,
          padding: 16,
        }}
      >
        {data.map((training) => (
          <TrainingCard key={training.id} training={training} />
        ))}
      </View>
    </View>
  );
}
