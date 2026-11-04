import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard } from '../common/auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list() {
    return this.usersService.list();
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
