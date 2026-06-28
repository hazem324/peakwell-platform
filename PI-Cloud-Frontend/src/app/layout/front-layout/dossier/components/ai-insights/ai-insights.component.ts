import { Component, OnInit } from '@angular/core';
import { DossierService } from '../../services/dossier.service';
import { BiometricResponse, MedicalProfileResponse } from '../../services/api.service';

interface Insight {
  category: 'nutrition' | 'fitness' | 'medical' | 'lifestyle';
  icon: string;
  title: string;
  description: string;
  severity: 'positive' | 'warning' | 'critical' | 'info';
  actionItems: string[];
  metric?: string;
  metricValue?: string;
}

interface RiskFactor {
  label: string;
  level: 'low' | 'moderate' | 'high';
  score: number; // 0-100
  description: string;
}

interface WeeklySummary {
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
  topInsight: string;
}

@Component({
  selector: 'app-ai-insights',
  templateUrl: './ai-insights.component.html',
  styleUrls: ['./ai-insights.component.scss']
})
export class AiInsightsComponent implements OnInit {
  insights: Insight[] = [];
  riskFactors: RiskFactor[] = [];
  weeklySummary: WeeklySummary | null = null;
  expandedInsight: number | null = null;
  hasData = false;
  loading = true;
  activeCategory = 'all';

  categories = [
    { value: 'all',       label: 'All Insights' },
    { value: 'nutrition',  label: 'Nutrition' },
    { value: 'fitness',    label: 'Fitness' },
    { value: 'medical',    label: 'Medical' },
    { value: 'lifestyle',  label: 'Lifestyle' },
  ];

  constructor(private dossierService: DossierService) {}

  ngOnInit(): void {
    this.dossierService.entries$.subscribe(entries => {
      const profile = this.dossierService.profile;
      this.hasData = entries.length > 0;
      if (this.hasData) {
        this.generateInsights(entries, profile);
        this.generateRiskFactors(entries, profile);
        this.generateWeeklySummary(entries);
      }
      this.loading = false;
    });
  }

  get filteredInsights(): Insight[] {
    if (this.activeCategory === 'all') return this.insights;
    return this.insights.filter(i => i.category === this.activeCategory);
  }

  toggleInsight(index: number): void {
    this.expandedInsight = this.expandedInsight === index ? null : index;
  }

  severityIcon(severity: string): string {
    const map: Record<string, string> = {
      positive: '✅', warning: '⚠️', critical: '🚨', info: 'ℹ️'
    };
    return map[severity] ?? 'ℹ️';
  }

  severityColor(severity: string): string {
    const map: Record<string, string> = {
      positive: '#7a9e7e', warning: '#e88f68', critical: '#c96a3f', info: '#4ab8f0'
    };
    return map[severity] ?? '#8a7e78';
  }

  riskColor(level: string): string {
    const map: Record<string, string> = {
      low: '#7a9e7e', moderate: '#e88f68', high: '#c96a3f'
    };
    return map[level] ?? '#8a7e78';
  }

  trendIcon(trend: string): string {
    const map: Record<string, string> = {
      improving: '📈', stable: '➡️', declining: '📉'
    };
    return map[trend] ?? '➡️';
  }

  get overallScoreColor(): string {
    if (!this.weeklySummary) return '#8a7e78';
    const s = this.weeklySummary.overallScore;
    if (s >= 80) return '#7a9e7e';
    if (s >= 60) return '#e88f68';
    return '#c96a3f';
  }

  // ── AI Analysis Engine ──────────────────────────

  private generateInsights(entries: BiometricResponse[], profile: MedicalProfileResponse | null): void {
    this.insights = [];
    const latest = entries[entries.length - 1];
    const prev = entries.length >= 2 ? entries[entries.length - 2] : null;
    const allWeights = entries.map(e => e.weight);

    // BMI Analysis
    const bmi = latest.bmi;
    if (bmi < 18.5) {
      this.insights.push({
        category: 'nutrition', icon: '🍽️', title: 'Underweight — caloric intake may be insufficient',
        description: `Your BMI of ${bmi} falls below the healthy range. This may indicate insufficient caloric intake or an underlying condition that accelerates metabolism.`,
        severity: 'warning', metric: 'BMI', metricValue: `${bmi}`,
        actionItems: ['Increase daily caloric intake by 300-500 kcal', 'Focus on nutrient-dense foods (nuts, avocados, whole grains)', 'Consider strength training to build lean mass', 'Consult a dietitian for a personalized gain plan']
      });
    } else if (bmi >= 25 && bmi < 30) {
      this.insights.push({
        category: 'nutrition', icon: '⚖️', title: 'Overweight range — dietary adjustments recommended',
        description: `Your BMI of ${bmi} places you in the overweight category. Small, sustainable changes in diet and activity can bring this into the healthy range over time.`,
        severity: 'warning', metric: 'BMI', metricValue: `${bmi}`,
        actionItems: ['Create a mild caloric deficit of 300-500 kcal/day', 'Increase vegetable intake to half of each plate', 'Reduce processed food and added sugars', 'Aim for 150 min/week of moderate exercise']
      });
    } else if (bmi >= 30) {
      this.insights.push({
        category: 'medical', icon: '🏥', title: 'Obesity range — medical guidance recommended',
        description: `Your BMI of ${bmi} falls in the obesity category, which is associated with increased risk for cardiovascular disease, diabetes, and joint issues.`,
        severity: 'critical', metric: 'BMI', metricValue: `${bmi}`,
        actionItems: ['Schedule a comprehensive health check-up', 'Work with a nutritionist for a structured meal plan', 'Start with low-impact exercise (walking, swimming)', 'Monitor blood pressure and glucose regularly']
      });
    } else {
      this.insights.push({
        category: 'nutrition', icon: '🎯', title: 'Healthy BMI — maintain current habits',
        description: `Your BMI of ${bmi} is within the ideal range (18.5–24.9). Keep up your current nutrition and activity patterns.`,
        severity: 'positive', metric: 'BMI', metricValue: `${bmi}`,
        actionItems: ['Continue balanced eating habits', 'Maintain regular physical activity', 'Monitor weight monthly to catch changes early']
      });
    }

    // Weight trend analysis
    if (entries.length >= 3) {
      const recent3 = allWeights.slice(-3);
      const isGaining = recent3[2] > recent3[1] && recent3[1] > recent3[0];
      const isLosing = recent3[2] < recent3[1] && recent3[1] < recent3[0];
      const totalChange = Math.round((recent3[2] - recent3[0]) * 10) / 10;

      if (isGaining && totalChange > 2) {
        this.insights.push({
          category: 'fitness', icon: '📊', title: `Consistent weight gain detected (+${totalChange} kg)`,
          description: `Your weight has increased consistently over the last ${entries.length >= 3 ? '3' : '2'} measurements. This pattern suggests a sustained caloric surplus.`,
          severity: 'warning', metric: 'Weight trend', metricValue: `+${totalChange} kg`,
          actionItems: ['Review your daily caloric intake vs expenditure', 'Increase aerobic activity by 20-30 min/day', 'Keep a food journal to identify excess consumption', 'Schedule a follow-up in 2 weeks to reassess']
        });
      } else if (isLosing && totalChange < -2) {
        this.insights.push({
          category: 'fitness', icon: '💪', title: `Positive weight loss trend (${totalChange} kg)`,
          description: `You've been losing weight consistently — a great sign of discipline. Ensure the rate is sustainable (0.5-1 kg/week is ideal).`,
          severity: 'positive', metric: 'Weight trend', metricValue: `${totalChange} kg`,
          actionItems: ['Maintain your current routine', 'Ensure adequate protein intake (1.6g/kg body weight)', 'Add resistance training to preserve muscle mass', 'Stay hydrated — aim for 2L+ daily']
        });
      }
    }

    // Blood pressure insights
    if (latest.systolic && latest.diastolic) {
      if (latest.systolic > 140 || latest.diastolic > 90) {
        this.insights.push({
          category: 'medical', icon: '❤️', title: 'High blood pressure — hypertension stage detected',
          description: `Your reading of ${latest.systolic}/${latest.diastolic} mmHg exceeds the hypertension threshold. This increases risk of stroke and heart disease.`,
          severity: 'critical', metric: 'Blood pressure', metricValue: `${latest.systolic}/${latest.diastolic} mmHg`,
          actionItems: ['Reduce sodium intake to under 1500mg/day', 'Practice stress management (meditation, deep breathing)', 'Limit caffeine and alcohol consumption', 'Consult your doctor about potential medication needs']
        });
      } else if (latest.systolic > 120 || latest.diastolic > 80) {
        this.insights.push({
          category: 'lifestyle', icon: '🧘', title: 'Elevated blood pressure — preventive action advised',
          description: `Your reading of ${latest.systolic}/${latest.diastolic} mmHg is above optimal. Lifestyle changes now can prevent progression to hypertension.`,
          severity: 'warning', metric: 'Blood pressure', metricValue: `${latest.systolic}/${latest.diastolic} mmHg`,
          actionItems: ['Increase potassium-rich foods (bananas, spinach, sweet potatoes)', 'Reduce processed and high-sodium foods', 'Exercise regularly — even 30 min walks help', 'Monitor BP weekly and track trends']
        });
      } else {
        this.insights.push({
          category: 'medical', icon: '💚', title: 'Optimal blood pressure',
          description: `Your reading of ${latest.systolic}/${latest.diastolic} mmHg is in the healthy range. Great cardiovascular health indicator.`,
          severity: 'positive', metric: 'Blood pressure', metricValue: `${latest.systolic}/${latest.diastolic} mmHg`,
          actionItems: ['Continue heart-healthy habits', 'Maintain regular exercise routine']
        });
      }
    }

    // Glucose insights
    if (latest.glucose) {
      if (latest.glucose > 126) {
        this.insights.push({
          category: 'medical', icon: '🩸', title: 'Fasting glucose in diabetic range',
          description: `A fasting glucose of ${latest.glucose} mg/dL is above the diabetic threshold of 126 mg/dL. This requires medical attention and dietary intervention.`,
          severity: 'critical', metric: 'Glucose', metricValue: `${latest.glucose} mg/dL`,
          actionItems: ['Consult your physician or endocrinologist', 'Adopt a low-glycemic-index diet immediately', 'Eliminate sugary beverages and refined carbs', 'Monitor glucose daily and log results']
        });
      } else if (latest.glucose > 100) {
        this.insights.push({
          category: 'nutrition', icon: '🥦', title: 'Pre-diabetic glucose level — diet intervention can reverse this',
          description: `Your glucose at ${latest.glucose} mg/dL is in the pre-diabetic range (100-126). Research shows dietary changes can prevent progression to diabetes.`,
          severity: 'warning', metric: 'Glucose', metricValue: `${latest.glucose} mg/dL`,
          actionItems: ['Increase fiber intake to 25-30g/day', 'Choose whole grains over refined carbohydrates', 'Add cinnamon to meals — shown to improve insulin sensitivity', 'Walk for 15 minutes after each meal']
        });
      }
    }

    // Body composition insight
    if (latest.bodyFat && latest.muscleMass) {
      const fatToMuscle = Math.round((latest.bodyFat / (latest.muscleMass / latest.weight * 100)) * 100) / 100;
      this.insights.push({
        category: 'fitness', icon: '🏋️', title: 'Body composition analysis',
        description: `Your body fat is ${latest.bodyFat}% with ${latest.muscleMass} kg muscle mass. ${latest.bodyFat > 30 ? 'Reducing fat while maintaining muscle should be the priority.' : latest.bodyFat < 15 ? 'Your body fat is lean — ensure adequate nutrition for recovery.' : 'Your composition is within a healthy range.'}`,
        severity: latest.bodyFat > 30 ? 'warning' : 'positive',
        metric: 'Body fat', metricValue: `${latest.bodyFat}%`,
        actionItems: [
          latest.bodyFat > 25 ? 'Combine cardio with resistance training' : 'Maintain current training regimen',
          'Ensure 1.6-2.2g protein per kg of body weight',
          'Get 7-9 hours of quality sleep for recovery',
          'Consider periodic body composition scans for accuracy'
        ]
      });
    }

    // Allergy/condition-based nutrition advice
    if (profile && profile.allergies && profile.allergies.length > 0) {
      const allergyStr = profile.allergies.join(', ');
      this.insights.push({
        category: 'nutrition', icon: '⚠️', title: `Dietary adjustments for your allergies`,
        description: `Based on your recorded allergies (${allergyStr}), here are nutrition strategies to ensure you get all essential nutrients while avoiding triggers.`,
        severity: 'info', metric: 'Allergies', metricValue: `${profile.allergies.length} recorded`,
        actionItems: this.getAllergyAdvice(profile.allergies)
      });
    }

    // Condition-based insights
    if (profile && profile.conditions && profile.conditions.length > 0) {
      for (const condition of profile.conditions) {
        const advice = this.getConditionAdvice(condition);
        if (advice) {
          this.insights.push(advice);
        }
      }
    }

    // Hydration & sleep (general lifestyle)
    this.insights.push({
      category: 'lifestyle', icon: '💧', title: 'Daily hydration reminder',
      description: `Based on your weight of ${latest.weight} kg, your recommended daily water intake is approximately ${Math.round(latest.weight * 0.033 * 10) / 10} liters. Proper hydration supports metabolism, digestion, and cognitive function.`,
      severity: 'info', metric: 'Recommended intake', metricValue: `${Math.round(latest.weight * 0.033 * 10) / 10} L/day`,
      actionItems: ['Drink a glass of water before each meal', 'Carry a reusable water bottle throughout the day', 'Set hourly reminders if you tend to forget', 'Monitor urine color — pale yellow indicates good hydration']
    });
  }

  private generateRiskFactors(entries: BiometricResponse[], profile: MedicalProfileResponse | null): void {
    this.riskFactors = [];
    const latest = entries[entries.length - 1];

    // Cardiovascular risk
    let cvScore = 20;
    if (latest.systolic && latest.systolic > 140) cvScore += 40;
    else if (latest.systolic && latest.systolic > 130) cvScore += 25;
    if (latest.bmi > 30) cvScore += 20;
    else if (latest.bmi > 25) cvScore += 10;
    if (profile?.conditions?.some(c => c.toLowerCase().includes('hypertension'))) cvScore += 15;
    cvScore = Math.min(cvScore, 100);
    this.riskFactors.push({
      label: 'Cardiovascular', score: cvScore,
      level: cvScore > 60 ? 'high' : cvScore > 35 ? 'moderate' : 'low',
      description: cvScore > 60 ? 'Multiple risk factors detected' : cvScore > 35 ? 'Some elevated markers' : 'Within healthy parameters'
    });

    // Metabolic risk
    let metScore = 15;
    if (latest.glucose && latest.glucose > 126) metScore += 45;
    else if (latest.glucose && latest.glucose > 100) metScore += 25;
    if (latest.bmi > 30) metScore += 20;
    if (profile?.conditions?.some(c => c.toLowerCase().includes('diabetes'))) metScore += 20;
    metScore = Math.min(metScore, 100);
    this.riskFactors.push({
      label: 'Metabolic', score: metScore,
      level: metScore > 60 ? 'high' : metScore > 35 ? 'moderate' : 'low',
      description: metScore > 60 ? 'Glucose and/or BMI concern' : metScore > 35 ? 'Borderline markers detected' : 'Metabolic health looks good'
    });

    // Nutritional risk
    let nutScore = 20;
    if (latest.bmi < 18.5) nutScore += 30;
    if (profile?.allergies && profile.allergies.length >= 3) nutScore += 20;
    if (!latest.bodyFat) nutScore += 10;
    nutScore = Math.min(nutScore, 100);
    this.riskFactors.push({
      label: 'Nutritional Deficiency', score: nutScore,
      level: nutScore > 60 ? 'high' : nutScore > 35 ? 'moderate' : 'low',
      description: nutScore > 60 ? 'Multiple dietary restrictions' : nutScore > 35 ? 'Some nutrient gaps possible' : 'Diet appears adequate'
    });
  }

  private generateWeeklySummary(entries: BiometricResponse[]): void {
    const latest = entries[entries.length - 1];
    let score = 70;

    // BMI contribution
    if (latest.bmi >= 18.5 && latest.bmi < 25) score += 15;
    else if (latest.bmi >= 25 && latest.bmi < 30) score -= 5;
    else score -= 15;

    // BP contribution
    if (latest.systolic && latest.systolic <= 120) score += 10;
    else if (latest.systolic && latest.systolic > 140) score -= 15;

    // Glucose contribution
    if (latest.glucose && latest.glucose <= 100) score += 10;
    else if (latest.glucose && latest.glucose > 126) score -= 15;

    // Trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (entries.length >= 2) {
      const prev = entries[entries.length - 2];
      const bmiDiff = latest.bmi - prev.bmi;
      if (bmiDiff < -0.3) trend = 'improving';
      else if (bmiDiff > 0.5) trend = 'declining';
    }

    score = Math.max(0, Math.min(100, score));

    const criticalCount = this.insights.filter(i => i.severity === 'critical').length;
    const warningCount = this.insights.filter(i => i.severity === 'warning').length;

    let topInsight = 'Your health metrics are within normal ranges. Keep up the good work!';
    if (criticalCount > 0) topInsight = `${criticalCount} critical finding${criticalCount > 1 ? 's' : ''} need${criticalCount === 1 ? 's' : ''} immediate attention.`;
    else if (warningCount > 0) topInsight = `${warningCount} area${warningCount > 1 ? 's' : ''} could use improvement — see recommendations below.`;

    this.weeklySummary = { overallScore: score, trend, topInsight };
  }

  private getAllergyAdvice(allergies: string[]): string[] {
    const advice: string[] = [];
    for (const allergy of allergies) {
      const lower = allergy.toLowerCase();
      if (lower.includes('gluten')) {
        advice.push('Replace wheat with quinoa, rice, buckwheat, or oats (certified GF)');
      }
      if (lower.includes('lactose') || lower.includes('dairy')) {
        advice.push('Use fortified plant milks (almond, oat, soy) for calcium and vitamin D');
      }
      if (lower.includes('nut')) {
        advice.push('Use seeds (sunflower, pumpkin) as alternative protein/fat sources');
      }
      if (lower.includes('egg')) {
        advice.push('Ensure adequate B12 and choline from other sources (fish, legumes)');
      }
      if (lower.includes('soy')) {
        advice.push('Choose alternative plant proteins: pea protein, hemp seeds, lentils');
      }
    }
    if (advice.length === 0) {
      advice.push('Read all food labels carefully for hidden allergens');
      advice.push('Inform your nutritionist about all allergies at each consultation');
    }
    advice.push('Keep an epinephrine auto-injector accessible if prescribed');
    return advice;
  }

  private getConditionAdvice(condition: string): Insight | null {
    const lower = condition.toLowerCase();
    if (lower.includes('diabetes') || lower.includes('diabetic')) {
      return {
        category: 'medical', icon: '🩺', title: `Condition management: ${condition}`,
        description: 'Your recorded condition requires ongoing dietary monitoring and potential medication adherence. Nutritional therapy is a cornerstone of management.',
        severity: 'warning', metric: 'Condition', metricValue: condition,
        actionItems: ['Follow a consistent carbohydrate-counting meal plan', 'Space meals evenly throughout the day', 'Prioritize low-glycemic foods', 'Keep a glucose log and share with your doctor']
      };
    }
    if (lower.includes('hypertension') || lower.includes('blood pressure')) {
      return {
        category: 'medical', icon: '🩺', title: `Condition management: ${condition}`,
        description: 'Managing hypertension through diet (DASH approach) can reduce systolic BP by 8-14 mmHg.',
        severity: 'warning', metric: 'Condition', metricValue: condition,
        actionItems: ['Follow the DASH diet pattern', 'Limit sodium to 1500mg/day', 'Increase potassium, magnesium, and calcium intake', 'Maintain a healthy weight and exercise regularly']
      };
    }
    if (lower.includes('thyroid') || lower.includes('hypothyroid')) {
      return {
        category: 'medical', icon: '🩺', title: `Condition management: ${condition}`,
        description: 'Thyroid conditions affect metabolism. Proper nutrition supports medication effectiveness and energy levels.',
        severity: 'info', metric: 'Condition', metricValue: condition,
        actionItems: ['Ensure adequate selenium and iodine intake', 'Take thyroid medication on an empty stomach', 'Limit goitrogens (raw cruciferous vegetables) around medication', 'Monitor energy levels and report changes to your doctor']
      };
    }
    return null;
  }
}