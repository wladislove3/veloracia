import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../radioDashboard.styles';

export default function LocationMapPlaceholder() {
  return (
    <View accessibilityElementsHidden style={styles.mapPlaceholder}>
      <View style={[styles.placeholderRoad, styles.placeholderRoadOne]} />
      <View style={[styles.placeholderRoad, styles.placeholderRoadTwo]} />
      <View style={[styles.placeholderRoad, styles.placeholderRoadThree]} />
      <View style={[styles.placeholderRoad, styles.placeholderRoadFour]} />
      <View style={styles.placeholderRoute} />
      <View style={styles.placeholderSignalOuter}>
        <View style={styles.placeholderSignalInner}><Text style={styles.placeholderSignalIcon}>⌖</Text></View>
      </View>
    </View>
  );
}
