import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review' })
  create(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews (optionally filtered by roomId)' })
  findAll(@Query('roomId') roomId?: string) {
    return this.reviewsService.findAll(roomId);
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Get reviews for a specific room with statistics' })
  getRoomReviews(@Param('roomId') roomId: string) {
    return this.reviewsService.getRoomReviews(roomId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review (only by owner)' })
  update(@Request() req, @Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete review (only by owner)' })
  remove(@Request() req, @Param('id') id: string) {
    return this.reviewsService.remove(id, req.user.id);
  }
}

