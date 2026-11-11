import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard } from '../common/auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.usersService.list({ search, role, page, pageSize });
  }

  @Post()
  create(
    @Body() body: { name: string; mobile: string; password?: string; role?: string; branchId?: number },
  ) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; mobile?: string; password?: string; role?: string; branchId?: number | null },
  ) {
    return this.usersService.update(id, body);
  }

  @Patch(':id/active')
  setActive(@Param('id', ParseIntPipe) id: number, @Body() body: { isActive: boolean }) {
    return this.usersService.setActive(id, body.isActive);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
