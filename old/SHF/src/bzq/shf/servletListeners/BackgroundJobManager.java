package bzq.shf.servletListeners;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import org.apache.log4j.Logger;

import bzq.shf.servletListenersTasks.IwdScheduledSenderTask;
import bzq.shf.servletListenersTasks.PoolExtensionAllocationTask;
import bzq.shf.servletListenersTasks.SMSBreakEndReminderTask;

public class BackgroundJobManager implements ServletContextListener {

	private static Logger logger = Logger.getLogger(BackgroundJobManager.class);
	
	private ScheduledExecutorService scheduler;
	
	public void contextInitialized(ServletContextEvent sce) {
		logger.debug("Starting contextInitialized()");
		
		logger.info("Registering tasks ...");
		try {
			scheduler = Executors.newSingleThreadScheduledExecutor();
			
			SMSBreakEndReminderTask sendSMSTask = new SMSBreakEndReminderTask();
			IwdScheduledSenderTask iwdTask = new IwdScheduledSenderTask();
			PoolExtensionAllocationTask extPoolTask = new PoolExtensionAllocationTask();
			
			sendSMSTask.setServCtx(sce.getServletContext());
			iwdTask.setServCtx(sce.getServletContext());
			extPoolTask.setServCtx(sce.getServletContext());
			
	        scheduler.scheduleAtFixedRate(sendSMSTask, 30, 120, TimeUnit.SECONDS);
	        scheduler.scheduleAtFixedRate(iwdTask, 120, 120, TimeUnit.SECONDS);
	        scheduler.scheduleAtFixedRate(extPoolTask, 30, 240, TimeUnit.SECONDS);
	        
	        logger.info("All tasks registered successfully");
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("Exception while Registering tasks", e);
		}
	}	// Method END
	
	
	public void contextDestroyed(ServletContextEvent sce) {
		logger.debug("Starting contextDestroyed()");
		
		logger.info("Attempting to stop the scheduler ...");
		try {
			scheduler.shutdown();
			logger.info("Scheduler was stopped successfully, new tasks will NOT be accepted");
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("Exception while attempting to stop the scheduler : " + e.getMessage(), e);
		}
	}	// Method END

}	// Class END
