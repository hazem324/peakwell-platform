import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterBySeverity' })
export class FilterBySeverityPipe implements PipeTransform {
  transform(items: any[], severity: string): any[] {
    return items ? items.filter(i => i.severity === severity) : [];
  }
}