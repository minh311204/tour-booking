import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { AdminDashboardService } from './admin-dashboard.service'

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  /** Thống kê + chuỗi doanh thu + top tour — lọc theo ngày / tháng / năm */
  @Get('stats')
  stats(
    @Query('granularity') granularity?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('year') year?: string,
    @Query('yearFrom') yearFrom?: string,
    @Query('yearTo') yearTo?: string,
  ) {
    const g = granularity === 'day' || granularity === 'month' || granularity === 'year'
      ? granularity
      : 'month'
    return this.dashboard.getStats({
      granularity: g,
      start,
      end,
      year,
      yearFrom,
      yearTo,
    })
  }
}
