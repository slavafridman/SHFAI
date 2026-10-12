package bzq.wfm.report;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.forms.TableForm;
import bzq.shf.actions.AttendanceDataAction;
import bzq.shf.actions.BaseAction;
import bzq.shf.utils.SHFTableUtils;

public class ScheduleHomeAction extends BaseAction{
	
	private Logger logger = Logger.getLogger(AttendanceDataAction.class);
	private XSSFWorkbook schWb =null;
	private XSSFWorkbook hrWb =null;
	
	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		ActionForward result=null;
		WfmReportForm wfmReportForm=(WfmReportForm)form;
		
		String param=(String)parameters.get("param");
		
		if("HR".equals(param)){
			if("build".equals(wfmReportForm.getMode())){
				logger.info("create HR report");
				if(wfmReportForm.getMoked()==null || "-1".equals(wfmReportForm.getMoked()) || "00".equals(wfmReportForm.getMoked())){
					ActionErrors errors=new ActionErrors();
					errors.add("SHF", new ActionError("shf.error.selectMoked"));
					saveErrors(request, errors);
					return mapping.findForward("success");
				}
				ArrayList<HRData> array=HRReportModel.getHRData(wfmReportForm);
				response.setContentType("application/vnd.ms-excel");
				Date now=new Date();
			    response.setHeader("Content-Disposition", "attachment; filename=HRReport_"+now.getTime()+".xlsx");
			    try {
					initHRReport(wfmReportForm);
					ReportExporter exporter=new ReportExporter();
					exporter.exportHR(hrWb, array, wfmReportForm);
					hrWb.write(response.getOutputStream());
				} catch (Exception e) {
					e.printStackTrace();
					logger.error(e);
				}
			}else{
				wfmReportForm.setStatus(3);
				result=mapping.findForward("success");
			}
			
		}else{
			
			ArrayList<TableForm> schedules=ScheduleReportModel.getAvailableSchedules();
			request.setAttribute("schedules", schedules);
			
			if("build".equals(wfmReportForm.getMode())){
				response.setContentType("application/vnd.ms-excel");
				response.setHeader("Content-Disposition", "attachment; filename=scheduleReport_"+new Date().getTime()+".xlsx");
	
	
				try{
					ArrayList<TableForm> sites=(ArrayList<TableForm>)request.getSession().getAttribute("sites");
					WFMReport wfmReport=ScheduleReportModel.createReport(wfmReportForm,sites);
	
					initScheduleReport();
					ReportExporter reportExporter=new ReportExporter();
					reportExporter.export(schWb,wfmReport);
					
					schWb.write(response.getOutputStream());
				    
					wfmReportForm.setMode(null);
				    request.setAttribute("wfmReportForm",wfmReportForm);
				}catch (Exception e) {
					e.printStackTrace();
					logger.error(e);
				}
			}else{
				getServlet().getServletContext().getRequestDispatcher("/jsp/wfm/schedule_report_params.jsp").forward(request, response);
			}
			
		}
		return result;
	}
	
	
	/**
	 * initialize report
	 */
	private void initScheduleReport() throws Exception{
		InputStream is=getClass().getClassLoader().getResourceAsStream("bzq/wfm/template/report_template_new.xlsx");
		schWb = new XSSFWorkbook(is);			
	}
	
	private void initHRReport(WfmReportForm wfmReportForm) throws Exception{
		InputStream is=getClass().getClassLoader().getResourceAsStream("bzq/wfm/template/hr_report_template.xlsx");
		hrWb = new XSSFWorkbook(is);
		Sheet sheet=hrWb.getSheet("HR");
		int nextCol=16;
		
		
		CellStyle activityCellStyle=hrWb.createCellStyle();
		activityCellStyle.cloneStyleFrom(sheet.getRow(4).getCell(2).getCellStyle());
		activityCellStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
		activityCellStyle.setFillPattern(CellStyle.SOLID_FOREGROUND);
		
		CellStyle skillCellStyle=hrWb.createCellStyle();
		skillCellStyle.cloneStyleFrom(sheet.getRow(4).getCell(2).getCellStyle());
		skillCellStyle.setFillForegroundColor(IndexedColors.GREEN.getIndex());
		skillCellStyle.setFillPattern(CellStyle.SOLID_FOREGROUND);
		
		
		String[] activityList=wfmReportForm.getActivityList();
		String[] skillList=wfmReportForm.getSkillList();
		
		Row titlesRow=sheet.getRow(4);
		
		if(activityList!=null && activityList.length>0 && !"00".equals(activityList[0])){
			for(int i=0;i<activityList.length;i++){
				Cell cell=titlesRow.createCell(nextCol++);
				cell.setCellValue(SHFTableUtils.getActivityName(activityList[i]));
				cell.setCellStyle(activityCellStyle);
			}
		}
		
		if(skillList!=null && skillList.length>0 && !"00".equals(skillList[0])){
			for(int i=0;i<skillList.length;i++){
				Cell cell=titlesRow.createCell(nextCol++);
				cell.setCellValue(SHFTableUtils.getSkillName(skillList[i]));
				cell.setCellStyle(skillCellStyle);
			}
		}
	}
}
