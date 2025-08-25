import { Injectable } from '@nestjs/common';
import { CreateAboutusDto } from './dto/create-aboutus.dto';
import { UpdateAboutusDto } from './dto/update-aboutus.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import { unlinkSync } from 'fs';

@Injectable()
export class AboutusService {
  constructor(
    private readonly prismaService: PrismaService, // Assuming you have a PrismaService for database operations
  ) {}
  async create(createAboutusDto: CreateAboutusDto, files: Express.Multer.File[]) {
    try {
      const {
        aboutus_achievment,
        aboutus_service,
        aboutus_story,
        content_en,
        content_id,
        title_en,
        title_id,
        is_published,
        aboutus_cta,
        aboutus_operational,
      } = createAboutusDto;
      const aboutUsFile = files.map(file => ({
        nama_file: file.filename,
        url: file.path,
      }));

      const aboutusService = aboutus_service.map(service => ({
        title_en: service.title_en,
        title_id: service.title_id,
        content_en: service.content_en,
        content_id: service.content_id,
        icon: service.icon,
        location: service.location,
      }));

      const aboutusAchievment = aboutus_achievment.map(achievment => ({
        number: achievment.number,
        content_en: achievment.content_en,
        content_id: achievment.content_id,
        icon: achievment.icon,
      }));

      const aboutusOperational = aboutus_operational.map(operational => ({
        day: operational.day,
        time: operational.time,
        is_highlight: operational.is_highlight ?? false,
      }));

      // Simpan data ke database
      const aboutus = await this.prismaService.aboutUs.create({
        data: {
          title_id,
          title_en,
          content_id,
          content_en,
          is_published: is_published ?? true,
          AboutUsStory: {
            create: {
              content_en: aboutus_story.content_en,
              content_id: aboutus_story.content_id,
              title_en: aboutus_story.title_en,
              title_id: aboutus_story.title_id,
            },
          },
          AboutUsCta: {
            create: {
              title_id: aboutus_cta.title_id,
              title_en: aboutus_cta.title_en,
              description_id: aboutus_cta.description_id,
              description_en: aboutus_cta.description_en,
              button_text: aboutus_cta.button_text,
              button_url: aboutus_cta.button_url,
            },
          },
          AboutUsOperational: {
            createMany: {
              data: aboutusOperational,
            },
          },
          AboutUsServices: {
            createMany: {
              data: aboutusService,
            },
          },
          AboutUsAchievements: {
            createMany: {
              data: aboutusAchievment,
            },
          },
          AboutUsFile: {
            createMany: {
              data: aboutUsFile,
            },
          },
        },
      });

      return aboutus;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = page * take - take;
      const count = await this.prismaService.aboutUs.count();
      const aboutus = await this.prismaService.aboutUs.findMany({
        skip,
        take,
        include: {
          AboutUsStory: true,
          AboutUsServices: true,
          AboutUsAchievements: true,
          AboutUsFile: true,
          AboutUsOperational: true,
          AboutUsCta: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return {
        data: aboutus,
        meta: {
          total: count,
          page,
          take,
          takeTotal: aboutus.length,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const aboutus = await this.prismaService.aboutUs.findUnique({
        where: { id },
        include: {
          AboutUsStory: true,
          AboutUsServices: true,
          AboutUsAchievements: true,
          AboutUsFile: true,
          AboutUsOperational: true,
          AboutUsCta: true,
        },
      });
      return aboutus;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async update(id: number, updateAboutusDto: UpdateAboutusDto, files: Express.Multer.File[]) {
    try {
      const {
        aboutus_achievment,
        aboutus_service,
        aboutus_story,
        content_en,
        content_id,
        title_en,
        title_id,
        is_published,
        aboutus_operational,
        aboutus_cta,
      } = updateAboutusDto;

      const operationalUpsert = aboutus_operational.map(operational => ({
        where: { id: operational.id },
        update: {
          day: operational.day,
          time: operational.time,
          is_highlight: operational.is_highlight ?? false,
        },
        create: {
          day: operational.day,
          time: operational.time,
          is_highlight: operational.is_highlight ?? false,
        },
      }));

      const serviceUpsert = aboutus_service.map(service => ({
        where: { id: service.id },
        update: {
          title_en: service.title_en,
          title_id: service.title_id,
          content_en: service.content_en,
          content_id: service.content_id,
          icon: service.icon,
          location: service.location,
        },
        create: {
          title_en: service.title_en,
          title_id: service.title_id,
          content_en: service.content_en,
          content_id: service.content_id,
          icon: service.icon,
          location: service.location,
        },
      }));

      const achievmentUpsert = aboutus_achievment.map(achievment => ({
        where: { id: achievment.id },
        update: {
          number: achievment.number,
          content_en: achievment.content_en,
          content_id: achievment.content_id,
          icon: achievment.icon,
        },
        create: {
          number: achievment.number,
          content_en: achievment.content_en,
          content_id: achievment.content_id,
          icon: achievment.icon,
        },
      }));

      const aboutUsFile = files.map(file => ({
        nama_file: file.filename,
        url: file.path,
      }));

      const preservedOperationalIds = aboutus_operational?.filter(c => c.id).map(c => c.id) ?? [];
      const preservedServiceIds = aboutus_service?.filter(c => c.id).map(c => c.id) ?? [];
      const preservedAchievmentIds = aboutus_achievment?.filter(c => c.id).map(c => c.id) ?? [];

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, __, ___, ____, update] = await this.prismaService.$transaction([
        this.prismaService.aboutUsOperational.deleteMany({
          where: {
            about_us_id: id,
            id: { notIn: preservedOperationalIds },
          },
        }),
        this.prismaService.aboutUsAchievements.deleteMany({
          where: {
            about_us_id: id,
            id: { notIn: preservedAchievmentIds },
          },
        }),
        this.prismaService.aboutUsServices.deleteMany({
          where: {
            about_us_id: id,
            id: { notIn: preservedServiceIds },
          },
        }),
        this.prismaService.aboutUsFile.deleteMany({
          where: { about_us_id: id },
        }),
        this.prismaService.aboutUs.update({
          where: { id },
          data: {
            title_id,
            title_en,
            content_id,
            content_en,
            is_published,
            AboutUsOperational: {
              upsert: operationalUpsert,
            },
            AboutUsCta: {
              update: {
                title_id: aboutus_cta.title_id,
                title_en: aboutus_cta.title_en,
                description_id: aboutus_cta.description_id,
                description_en: aboutus_cta.description_en,
                button_text: aboutus_cta.button_text,
                button_url: aboutus_cta.button_url,
              },
            },
            AboutUsStory: {
              update: {
                content_en: aboutus_story.content_en,
                content_id: aboutus_story.content_id,
                title_en: aboutus_story.title_en,
                title_id: aboutus_story.title_id,
              },
            },
            AboutUsFile: {
              createMany: {
                data: aboutUsFile,
              },
            },
            AboutUsServices: {
              upsert: serviceUpsert,
            },
            AboutUsAchievements: {
              upsert: achievmentUpsert,
            },
          },
        }),
      ]);

      // Perbarui data di database
      // const aboutus = await this.prismaService.aboutUs.update({
      //   where: { id },
      //   data: {
      //     title_id,
      //     title_en,
      //     content_id,
      //     content_en,
      //     is_published,
      //     AboutUsStory: {
      //       update: {
      //         content_en: aboutus_story.content_en,
      //         content_id: aboutus_story.content_id,
      //         title_en: aboutus_story.title_en,
      //         title_id: aboutus_story.title_id,
      //       },
      //     },
      //     AboutUsFile: {
      //       createMany: {
      //         data: aboutUsFile,
      //       },
      //     },
      //     AboutUsServices: {
      //       upsert: serviceUpsert,
      //     },
      //     AboutUsAchievements: {
      //       update: {
      //         number: aboutus_achievment.number,
      //         content_en: aboutus_achievment.content_en,
      //         content_id: aboutus_achievment.content_id,
      //         icon: aboutus_achievment.icon,
      //       },
      //     },
      //   },
      // });

      return update;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const aboutUsList = await this.prismaService.aboutUs.findUnique({
        where: { id },
        include: { AboutUsFile: true },
      });

      // Hapus file terkait dari penyimpanan (jika ada)
      aboutUsList.AboutUsFile.forEach(file => {
        try {
          unlinkSync(file.url); // Hapus file dari sistem file
        } catch (err) {
          console.error(`Failed to delete file: ${file.url}`, err);
        }
      });
      // Hapus data dari database
      const aboutus = await this.prismaService.$transaction([
        this.prismaService.aboutUsFile.deleteMany({
          where: { about_us_id: id },
        }),
        this.prismaService.aboutUsServices.deleteMany({
          where: { about_us_id: id },
        }),
        this.prismaService.aboutUsAchievements.deleteMany({
          where: { about_us_id: id },
        }),
        this.prismaService.aboutUsStory.deleteMany({
          where: { about_us_id: id },
        }),
        this.prismaService.aboutUs.delete({
          where: { id },
        }),
      ]);
      return aboutus;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
