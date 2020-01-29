import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public days: string = '-';
  public hours: string = '-';
  public minutes: string = '-';
  public seconds: string = '-';
  private _weddingDate: number;

  public ngOnInit(): void {
    this._startCountdown();
  }

  private _startCountdown(): void {
    this._weddingDate = new Date(2020, 8, 1, 15).getTime();
    this._updateCountdown();

    setInterval(() => {
      this._updateCountdown();
    }, 1000)
  }

  private _updateCountdown() {
    const now: number = new Date().getTime();
    const timeSpan: number = this._weddingDate - now;

    this.days = Math.floor(timeSpan / (1000 * 60 * 60 * 24)).toFixed(0);
    this.hours = AppComponent._setDigitsCount(Math.floor((timeSpan % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), 2);
    this.minutes = AppComponent._setDigitsCount(Math.floor((timeSpan % (1000 * 60 * 60)) / (1000 * 60)), 2);
    this.seconds = AppComponent._setDigitsCount(Math.floor((timeSpan % (1000 * 60)) / 1000), 2);
  }

  private static _setDigitsCount(input: number, digits: number): string {
    return input.toFixed(0).padStart(digits, '0');
  }
}
