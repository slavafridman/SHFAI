package bzq.wfm.report;

import java.util.ArrayList;
import java.util.Date;
import java.util.Hashtable;
import java.util.Iterator;

import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellRange;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFFormulaEvaluator;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import com.ibm.websphere.models.config.topology.cell.CellType;


public class ReportExporter {
	
	private static final int FIRST_ROW_NUM = 11;
	private static final int hours=120;//96
	
	public ReportExporter(){
		
	}
		
	
	private void writeDataSheet(Sheet sheet,ScheduleReport report) {
		writeShiftLength(sheet,report);
		writeDayData(sheet,report);
	}
	
	
	private void writeDayData(Sheet sheet, ScheduleReport report) {
		float[][] breaks=report.getBreaks();
		short[][] proto=report.getProto();
		float[][] exceptions=report.getExceptions();
		short[][] required=report.getNetoNeeded();
		short[][] forecast=report.getForecast();
		
		CellStyle zmeenootCellStyleYellow=sheet.getWorkbook().createCellStyle();
    	zmeenootCellStyleYellow.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
    	zmeenootCellStyleYellow.setFillPattern(CellStyle.SOLID_FOREGROUND);
    	
    	CellStyle zmeenootCellStyleRed=sheet.getWorkbook().createCellStyle();
    	zmeenootCellStyleRed.setFillForegroundColor(IndexedColors.RED.getIndex());
    	zmeenootCellStyleRed.setFillPattern(CellStyle.SOLID_FOREGROUND);
    	
    	CellStyle zmeenootCellStyleGreen=sheet.getWorkbook().createCellStyle();
    	zmeenootCellStyleGreen.setFillForegroundColor(IndexedColors.GREEN.getIndex());
    	zmeenootCellStyleGreen.setFillPattern(CellStyle.SOLID_FOREGROUND);
    	
    	CellStyle zmeenootCellStyleTrans=sheet.getWorkbook().createCellStyle();
    	zmeenootCellStyleTrans.setFillForegroundColor(IndexedColors.AUTOMATIC.getIndex());
    	zmeenootCellStyleTrans.setFillPattern(CellStyle.NO_FILL);
    	
		int columnNum,rowNum;
		int tmp=0;
		Row row=null;
	    Cell cell=null,cellZmeenootValue=null,cellZmeenootMask=null;
	    if(breaks!=null){
	    	float neto,breakRatio;
	    	short requiredVal;
			for(int day=0;day<8;day++){
				columnNum=(day*18) - (day)+11;
				tmp=0;
				for(int h=0;h<hours;h++){
					if(h%5==0){
						tmp++;
						continue;
					}
					
					rowNum=h+FIRST_ROW_NUM;
					row=sheet.getRow(rowNum);
			    	
					//write proto
			    	cell=row.getCell(columnNum);
			    	cell.setCellValue(proto[day][h-tmp]);
			    	
			    	//write neto
			    	cell=row.getCell(day==7?columnNum+1:columnNum+4); //in the weekly summary the column location is different
			    	neto=proto[day][h-tmp]-(breaks[day][h-tmp]+exceptions[day][h-tmp]); 
			    	cell.setCellValue(neto);
			    	
			    	//write required
			    	requiredVal=required[day][h-tmp];
			    	cell=row.getCell(columnNum-8);
			    	cell.setCellValue(requiredVal);
			    	
			    	//write forecast
			    	cell=row.getCell(columnNum-9);
			    	cell.setCellValue(forecast[day][h-tmp]);
			    	
			    	//write gap
			    	cell=row.getCell(day==7?columnNum+2:columnNum+5); //in the weekly summary the column location is different
			    	cell.setCellValue(neto-requiredVal);
			    	
			    	//these column are not calculated in the weekly summary
			    	if(day<7){
						//write breaks
						cell=row.getCell(columnNum+1);
				    	cell.setCellValue(breaks[day][h-tmp]);
				    	
				    	//write break ratio
				    	cell=row.getCell(columnNum+2);
				    	breakRatio=0;
				    	if(proto[day][h-tmp]!=0){
				    		breakRatio=breaks[day][h-tmp]/proto[day][h-tmp];
				    	}
				    	cell.setCellValue(breakRatio);
				    	
				    	//write exceptions
				    	cell=row.getCell(columnNum+3);
				    	cell.setCellValue(exceptions[day][h-tmp]);
				    		    	
				    	
				    	//write zmeenoot
				    	
				    	float val=neto/required[day][h-tmp]-1;
				    	
				    	val*=100.0;
				    	cellZmeenootValue=row.getCell(columnNum+6);
				    	cellZmeenootMask=row.getCell(columnNum+7);
				    	
				    	if(neto==0){
				    		cellZmeenootValue.setCellValue("");
				    		cellZmeenootMask.setCellStyle(zmeenootCellStyleTrans);
				    	}else{
				    		cellZmeenootValue.setCellValue(val);
				    	}
				    	
				    	if(val>-5){
				    		cellZmeenootMask.setCellStyle(zmeenootCellStyleGreen);
				    	}else if(val<-5 && val>=-10){
				    		cellZmeenootMask.setCellStyle(zmeenootCellStyleYellow);
				    	}else if(val<-10 && val>=-17){
				    		cellZmeenootMask.setCellStyle(zmeenootCellStyleYellow);
				    	}else if(val<-17 && val>=-22){
				    		cellZmeenootMask.setCellStyle(zmeenootCellStyleRed);
				    	}else if(val<-22){
				    		cellZmeenootMask.setCellStyle(zmeenootCellStyleRed);
				    	}
				    	

			    	}
			    	
				}
			}
		}
	}
	
	
	private void writeShiftLength(Sheet sheet,ScheduleReport report) {
		
		short[][][] shiftLengths=report.getShiftsLength(); 
		float[][] summary=report.getSummury();
		float[][] tamheel=report.getTamheel();
	    int columnNum,rowNum,firstColumn;
	    
	    Row row=null;
	    Cell cell=null;
	    int tmp=0;
	    for(int day=0;day<8;day++){
	    	
	    	firstColumn=(day*18) - (day)+1; 
	    	for(int j=0;j<7;j++){
	    		tmp=0;
	    		for(int i=0;i<hours;i++){
	    			if(i%5==0){
	    				tmp++;
	    				continue;
	    			}
	    			columnNum=(firstColumn)+j+3;
		    		rowNum=i+FIRST_ROW_NUM;
		    		row=sheet.getRow(rowNum);
			    	cell=row.getCell(columnNum);
			    	cell.setCellValue(shiftLengths[day][i-tmp][j]);
		    	}
		    	
		    	row=sheet.getRow(FIRST_ROW_NUM+hours);
		    	cell=row.getCell(firstColumn+j+3);
		    	cell.setCellValue(summary[day][j]);
		    	
		    	row=sheet.getRow(FIRST_ROW_NUM+hours+1);
		    	cell=row.getCell(firstColumn+j+3);
		    	cell.setCellValue(tamheel[day][j]);
		    	
		    }
	    }
		   
	}
	

	
	private void writeSitesReports(XSSFWorkbook wb,Hashtable<String, ScheduleReport> sitesReports) {
		if(sitesReports!=null && sitesReports.size()>0){
			Iterator<String> it=sitesReports.keySet().iterator();
			for(;it.hasNext();){
				String site=it.next();
				XSSFSheet newSheet=wb.cloneSheet(0);
				newSheet.setRightToLeft(true);
				newSheet.setTabColor(3);
				wb.setSheetOrder(newSheet.getSheetName(),1);
				String title=sitesReports.get(site).getTitle();
				if(title!=null){
					wb.setSheetName(1,title );
				}
				writeDataSheet(newSheet,sitesReports.get(site));
				//duplicateRows(newSheet, 0, 110, 111);
			}
			
			
		}
	}


	private void writeVirtualActivitiesReports(XSSFWorkbook wb,Hashtable<String, ScheduleReport> virtualActivitiesReports) {
		if(virtualActivitiesReports!=null && virtualActivitiesReports.size()>0){
			Iterator<String> it=virtualActivitiesReports.keySet().iterator();
			for(;it.hasNext();){
				String virtualActivity=it.next();
				XSSFSheet newSheet=wb.cloneSheet(0);
				newSheet.setRightToLeft(true);
				newSheet.setTabColor(4);
				wb.setSheetOrder(newSheet.getSheetName(),1);
				String title=virtualActivitiesReports.get(virtualActivity).getTitle();
				if(title!=null){
					wb.setSheetName(1, title);
				}
				writeDataSheet(newSheet,virtualActivitiesReports.get(virtualActivity));
			}
		}
		
	}
	
	
	private void writeTamheelData(Sheet tamheelSheet, 
			Hashtable<String, ScheduleReport> sitesReports, 
			Hashtable<String, TamheelReport> tamheelTable) {
		
		if(sitesReports!=null && tamheelTable!=null){
			Iterator<String> it=sitesReports.keySet().iterator();
			int i=2;
			for(;it.hasNext();){
				String site=it.next();
				tamheelSheet.setRightToLeft(true);
				Row row=tamheelSheet.getRow(3);
				Cell cell=row.getCell(i);
				
				String siteName=sitesReports.get(site).getTitle();
				cell.setCellValue(siteName);
				
				TamheelReport tamheelReport=tamheelTable.get(site);
				Hashtable<Integer, Integer> siteTamheel = tamheelReport.getData();
				
				
				for(int j=0;j<8;j++){
					row=tamheelSheet.getRow(4+j);
					cell=row.getCell(i);
					cell.setCellValue(siteTamheel.get(j)==null?0:siteTamheel.get(j));
				}
				
				i++;
			}
		}
	}
	
	public void export(XSSFWorkbook wb, WFMReport wfmReport) {

		Sheet artsiSheet=wb.getSheetAt(0);
		Sheet summarySheet=wb.getSheetAt(1);
		Sheet tamheelSheet=wb.getSheetAt(2);
		
		writeDataSheet(artsiSheet, wfmReport.getArtsi());
		Row titleRow=artsiSheet.getRow(1);
		titleRow.getCell(4).setCellValue(new Date());
		titleRow.getCell(9).setCellValue(wfmReport.getScheduleName());
		titleRow.getCell(15).setCellValue(wfmReport.getForecastName());
		
		
		
		Hashtable<String, ScheduleReport> virtualActivitiesReports=wfmReport.getVirtualActivitiesReports();
		writeVirtualActivitiesReports(wb,virtualActivitiesReports);
		
		Hashtable<String, ScheduleReport> sitesReports=wfmReport.getSitesReports();
		writeSitesReports(wb,sitesReports);
		
		writeTamheelData(tamheelSheet,sitesReports,wfmReport.getTamheel());
		
		writeSummaryData(summarySheet,sitesReports,virtualActivitiesReports,null);
		XSSFFormulaEvaluator.evaluateAllFormulaCells(wb);
	}
	
	
	private void writeSummaryData(Sheet summarySheet,
			Hashtable<String, ScheduleReport> sitesReports,
			Hashtable<String, ScheduleReport> virtualActivitiesReports,
			SummaryReport summary){
		
		if(virtualActivitiesReports==null){
			return;
		}
		
		CellStyle negativeSummary=summarySheet.getWorkbook().createCellStyle();
		negativeSummary.cloneStyleFrom(summarySheet.getRow(5).getCell(3).getCellStyle());
		Font redFont=summarySheet.getWorkbook().createFont();
		redFont.setColor(Font.COLOR_RED);
		negativeSummary.setFont(redFont);
		int activitiesNum=virtualActivitiesReports.keySet().size();
		
		Row existingMainTitle=summarySheet.getRow(3);
		Row existingTitles=summarySheet.getRow(4);
		Row existingSum=summarySheet.getRow(6);
		Row existing1=summarySheet.getRow(5);
		float[] array=null;
		float sum=0f;
		int day=0;
		ArrayList<Integer> rowsIndeces=new ArrayList<Integer>();
		Iterator<ScheduleReport> actItr=virtualActivitiesReports.values().iterator();
		ScheduleReport report=actItr.next();
		
		if(report!=null){
			existing1.getCell(1).setCellValue(report.getTitle());
			array=report.getDiffAvg();
			if(array!=null){
				sum=0f;
				for(day=0;day<array.length;day++){
					existing1.getCell(day+3).setCellValue(array[day]);
					sum+=array[day];
					if(array[day]<0){
						existing1.getCell(day+3).setCellStyle(negativeSummary);
					}
				}
				existing1.getCell(day+3).setCellValue(sum);
			}
		}
		
		int rowind=9;
		for(;actItr.hasNext();){
			report=actItr.next();
			Row newRow1=createNewRow(summarySheet, 6);
			rowind+=1;
			duplicateRow(existing1, newRow1, 20);
			newRow1.getCell(1).setCellValue(report.getTitle());
			array=report.getDiffAvg();
			if(array!=null){
				sum=0f;
				for(day=0;day<array.length;day++){
					newRow1.getCell(day+3).setCellValue(array[day]);
					sum+=array[day];
					if(array[day]<0){
						newRow1.getCell(day+3).setCellStyle(negativeSummary);
					}
				}
				newRow1.getCell(day+3).setCellValue(sum);
			}
		}
		
		// set bottom sum row
		Cell cell=null;
		for(day=0;day<8;day++){
			cell=existingSum.getCell(day+3);
			cell.setCellType(XSSFCell.CELL_TYPE_FORMULA);
			int rowindex=cell.getRowIndex();
			int colindex=cell.getColumnIndex();
			
			String colString=CellReference.convertNumToColString(colindex);
			String rangeFrom=colString+""+(rowindex-activitiesNum+1);
			String rangeTo=colString+""+(rowindex);
			
			cell.setCellFormula("SUM("+rangeFrom+":"+rangeTo+")");
		}
		
		
		Iterator<ScheduleReport> siteItr=sitesReports.values().iterator();
		for(;siteItr.hasNext();){
			report=siteItr.next();
			
			Row newMainTitle=createNewRow(summarySheet,rowind++);
			duplicateRow(existingMainTitle, newMainTitle , 20);
			newMainTitle.getCell(1).setCellValue(report.getTitle());
			
			duplicateRow(existingTitles, createNewRow(summarySheet,rowind++) , 20);
			rowsIndeces.add(rowind);
			int j=0;
			Hashtable<String, ScheduleReport> siteActivityReports=report.getSiteActivitiesReports();
			
			//if site has activitis reports 
			if(siteActivityReports!=null){
				Iterator<String> strItr=virtualActivitiesReports.keySet().iterator();
				for(;strItr.hasNext();j++){
					String activity=strItr.next();
					ScheduleReport activityReport=virtualActivitiesReports.get(activity);
					ScheduleReport siteActivityReport=siteActivityReports.get(activity);
					
					Row newRow1=createNewRow(summarySheet, rowind);
					duplicateRow(existing1, newRow1, 20);
					
					
					if(siteActivityReport!=null){
						array=siteActivityReport.getDiffAvg();
						if(array!=null){
							sum=0f;
							for(day=0;day<array.length;day++){
								newRow1.getCell(day+3).setCellValue(array[day]);
								sum+=array[day];
								if(array[day]<0){
									newRow1.getCell(day+3).setCellStyle(negativeSummary);
								}
							}
							newRow1.getCell(day+3).setCellValue(sum);
						}
					}
					
					newRow1.getCell(1).setCellValue(activityReport.getTitle());
				}
				rowind+=j;
				Row newSummary=createNewRow(summarySheet,rowind++);
				duplicateRow(existingSum, newSummary , 20);
				// set bottom sum row
				for(day=0;day<8;day++){
					cell=newSummary.getCell(day+3);
					cell.setCellType(XSSFCell.CELL_TYPE_FORMULA);
					int rowindex=cell.getRowIndex();
					int colindex=cell.getColumnIndex();
					
					String colString=CellReference.convertNumToColString(colindex);
					String rangeFrom=colString+""+(rowindex-activitiesNum+1);
					String rangeTo=colString+""+(rowindex);
					
					cell.setCellFormula("SUM("+rangeFrom+":"+rangeTo+")");
				}
				
				createNewRow(summarySheet,rowind++);
			}
		}
		
	}
	
	
	
	/**
	 * create new row
	 * @param sheet
	 * @param index
	 * @return
	 */
	private Row createNewRow(Sheet sheet,int index){
		Row newRow=null;
		sheet.shiftRows(index, 1000, 1, true, false);
		newRow = sheet.createRow(index);
		newRow = sheet.getRow(index);
		return newRow;
	}
	
	
	/**
	 * duplicate existing row;
	 * @param sheet
	 * @param rowNum
	 * @return
	 */
	private void duplicateRow(Row existing,Row newRow,int cols){
		if(existing==null || newRow==null) return;
		for (int i = 0; i < cols; i++) {
            // Grab a copy of the old/new cell
			Cell oldCell = existing.getCell(i);
			Cell newCell = newRow.createCell(i);
			
            // If the old cell is null jump to next cell
            if (oldCell == null) {
            	newCell = null;
            	continue;
            }
            
            // Copy style from old cell and apply to new cell
            CellStyle newCellStyle = existing.getSheet().getWorkbook().createCellStyle();
            newCellStyle.cloneStyleFrom(oldCell.getCellStyle());
            
            newCell.setCellStyle(newCellStyle);
            
            // Set the cell data value
            switch (oldCell.getCellType()) {
                case Cell.CELL_TYPE_BLANK:
                    newCell.setCellValue(oldCell.getStringCellValue());
                    break;
                case Cell.CELL_TYPE_BOOLEAN:
                    newCell.setCellValue(oldCell.getBooleanCellValue());
                    break;
                case Cell.CELL_TYPE_ERROR:
                    newCell.setCellErrorValue(oldCell.getErrorCellValue());
                    break;
                case Cell.CELL_TYPE_FORMULA:
                    newCell.setCellFormula(oldCell.getCellFormula());
                    break;
                case Cell.CELL_TYPE_NUMERIC:
                    newCell.setCellValue(oldCell.getNumericCellValue());
                    break;
                case Cell.CELL_TYPE_STRING:
                    newCell.setCellValue(oldCell.getRichStringCellValue());
                    break;
            }

            
            
		}
	}


	public void exportHR(XSSFWorkbook hrWb, ArrayList<HRData> array , WfmReportForm reportForm) {
		Sheet hrReportSheet=hrWb.getSheetAt(0);
		Row row1=hrReportSheet.getRow(1);
		Row row2=hrReportSheet.getRow(2);
		row1.getCell(2).setCellValue(reportForm.getUserFirstName()+" "+reportForm.getUserLastName());
		row2.getCell(2).setCellValue(new Date());
		
		CellStyle activityCellStyle=hrWb.createCellStyle();
		activityCellStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
		activityCellStyle.setFillPattern(CellStyle.SOLID_FOREGROUND);
		
		CellStyle sumStyle=hrWb.createCellStyle();
		sumStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
		sumStyle.setFillPattern(CellStyle.SOLID_FOREGROUND);
		
		if(array!=null){
			Row newRow=null;
			HRData hrData=null;
			String lastTeam=null;
			String lastMoked=null;
			if(array.size()>0){
				hrData=array.get(0);
				lastTeam=hrData.getTeam();
				lastMoked=hrData.getMoked();
			}
			int rowNum=5;
			int lastTeamGroupRow=5;
			int[] activities=null;
			String[] skills=null;
			
			for(int i=0;i<array.size();i++){
				hrData=array.get(i);
				String team=hrData.getTeam();
				String moked=hrData.getMoked();
				
				activities=hrData.activitiesFlag;
				skills=hrData.skillsFlag;
				
				if(!team.equals(lastTeam)){
					
					hrReportSheet.groupRow(lastTeamGroupRow,rowNum);             
					hrReportSheet.setRowGroupCollapsed(lastTeamGroupRow, true); 
					newRow=hrReportSheet.createRow(rowNum);
					newRow.createCell(0).setCellValue(lastTeam);
					
					int tmpInd=16;
					if(activities!=null){
						for(int activity:activities){
							Cell cell=newRow.createCell(tmpInd);
							String colName=CellReference.convertNumToColString(tmpInd);
							String strFormula = (rowNum-lastTeamGroupRow)+ " - COUNTBLANK("+colName+(lastTeamGroupRow+1) +":"+colName+rowNum +")";
							cell.setCellType(HSSFCell.CELL_TYPE_FORMULA);
							cell.setCellFormula(strFormula);
							cell.setCellStyle(sumStyle);
							tmpInd++;
						}
					}
					
					if(skills!=null){
						for(String skill:skills){
							Cell cell=newRow.createCell(tmpInd);
							String colName=CellReference.convertNumToColString(tmpInd);
							String strFormula = (rowNum-lastTeamGroupRow)+ " - COUNTBLANK("+colName+(lastTeamGroupRow+1) +":"+colName+rowNum +")";
							cell.setCellType(HSSFCell.CELL_TYPE_FORMULA);
							cell.setCellFormula(strFormula);
							cell.setCellStyle(sumStyle);
							tmpInd++;
						}
					}
					
					rowNum++;
					lastTeamGroupRow=rowNum;
					
				}
				
				newRow=hrReportSheet.createRow(rowNum);
				newRow.createCell(1).setCellValue(hrData.getAgaf());
				newRow.createCell(2).setCellValue(moked);
				newRow.createCell(3).setCellValue(team);
				newRow.createCell(4).setCellValue(hrData.getIdnum());
				newRow.createCell(5).setCellValue(hrData.getEmpName());
				newRow.createCell(6).setCellValue(hrData.getSapStatus());
				newRow.createCell(7).setCellValue(hrData.getSapJob());
				newRow.createCell(8).setCellValue(hrData.getInnerJob());
				newRow.createCell(9).setCellValue(hrData.getSapJobTime());
				newRow.createCell(10).setCellValue(hrData.getContractName());
				if(hrData.getSapStartDate()!=null){
					newRow.createCell(11).setCellValue(hrData.getSapStartDate());
				}
				
				if(hrData.getWfmStartDate()!=null){
					newRow.createCell(12).setCellValue(hrData.getWfmStartDate());
				}
				
				if(hrData.getWfmTerminationDate()!=null){
					newRow.createCell(13).setCellValue(hrData.getWfmTerminationDate());
				}
				newRow.createCell(14).setCellValue(hrData.getWeekMinMinutes()/60);
				newRow.createCell(15).setCellValue(hrData.getWeekMaxMinutes()/60);
				
				int index=16;
				if(activities!=null){
					for(int activity:activities){
						newRow.createCell(index);
						newRow.getCell(index).setCellValue(activity==0?"v":"");
						index++;
					}
				}
				
				if(skills!=null){
					for(String skill:skills){
						newRow.createCell(index);
						newRow.getCell(index).setCellValue(skill);
						index++;
					}
				}
								
				lastTeam=hrData.getTeam();
				lastMoked=hrData.getMoked();
				
				rowNum++;
			}
			
			hrReportSheet.groupRow(lastTeamGroupRow,rowNum);             
			hrReportSheet.setRowGroupCollapsed(lastTeamGroupRow, true); 
			newRow=hrReportSheet.createRow(rowNum);
			newRow.createCell(0).setCellValue(lastTeam);
			int tmpInd=16;
			if(activities!=null){
				for(int activity:activities){
					Cell cell=newRow.createCell(tmpInd);
					String colName=CellReference.convertNumToColString(tmpInd);
					String strFormula = (rowNum-lastTeamGroupRow)+ " - COUNTBLANK("+colName+(lastTeamGroupRow+1) +":"+colName+rowNum +")";
					cell.setCellType(HSSFCell.CELL_TYPE_FORMULA);
					cell.setCellFormula(strFormula);
					cell.setCellStyle(sumStyle);
					tmpInd++;
				}
			}
			
			if(skills!=null){
				for(String skill:skills){
					Cell cell=newRow.createCell(tmpInd);
					String colName=CellReference.convertNumToColString(tmpInd);
					String strFormula = (rowNum-lastTeamGroupRow)+ " - COUNTBLANK("+colName+(lastTeamGroupRow+1) +":"+colName+rowNum +")";
					cell.setCellType(HSSFCell.CELL_TYPE_FORMULA);
					cell.setCellFormula(strFormula);
					cell.setCellStyle(sumStyle);
					tmpInd++;
				}
			}
			rowNum++;
			lastTeamGroupRow=rowNum;
			
			
			
		}
		XSSFFormulaEvaluator.evaluateAllFormulaCells(hrWb);
	}
	
	/*
	private void duplicateRows(Sheet sheet, int from , int to ,int targetStart){
		Row newRow=null;
		for(int i=from;i<=to;i++){
			newRow=createNewRow(sheet, targetStart+i);
			duplicateRow(sheet.getRow(i), newRow, 135); //135 columns
		}
	}
	*/
}
